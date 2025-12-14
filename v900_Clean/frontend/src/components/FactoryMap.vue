<script>
import axios from 'axios';

export default {
  name: 'FactoryMap',
  data() {
    return {
      loading: true,
      error: null,
      activeShipments: [],
      warehouseInventory: {},
      warehouseInventoryDetails: {}, // Detailed inventory with count and weight
      pollingInterval: null,
      lastUpdateTime: null,
      // Location coordinates mapping (matching SVG positions)
      locationCoordinates: {
        'Entrance1': { x: 320, y: 760 },  // Left entrance - moved under W1
        'Weight_Station_1': { x: 390, y: 540 },  // Moved up vertically
        'Weight_Station_2': { x: 1170, y: 370 },
        'Entrance2': { x: 1070, y: 760 },  // Right entrance - moved to right
        'Anbar_PAK': { x: 1410, y: 620 },
        'Anbar_Khamir_Kordan': { x: 1070, y: 200 },
        'Anbar_Khamir_Ghadim': { x: 805, y: 150 },
        'Anbar_Parvandeh': { x: 335, y: 94 },
        'Anbar_Koochak': { x: 335, y: 170 },
        'Anbar_Sangin': { x: 660, y: 560 },
        'Anbar_Salon_Tolid': { x: 140, y: 237 },
        'Anbar_Akhal': { x: 200, y: 905 },
        'Loading_Unloading': { x: 510, y: 610 },
        'Office': { x: 1070, y: 724 },
        'QC': { x: 845, y: 580 },
      },
      truckStopPositions: {
        'Entrance1': { x: 390, y: 760 },  // Left entrance - moved under W1
        'Weight_Station_1': { x: 390, y: 540 },
        'Anbar_Salon_Tolid': { x: 350, y: 300 },
        'Anbar_Akhal': { x: 160, y: 825 },
        'Anbar_PAK': { x: 1410, y: 820 },
        'Anbar_Khamir_Kordan': { x: 1070, y: 200 },
        'Anbar_Mohavate_Kardan': { x: 1070, y: 130 },
        'Anbar_Khamir_Ghadim': { x: 805, y: 150 },
        'Anbar_Mohavate_Homayoun': { x: 550, y: 150 },
        'Anbar_Parvandeh': { x: 355, y: 94 },
        'Anbar_Koochak': { x: 355, y: 170 },
        'Anbar_Sangin': { x: 660, y: 560 },
        'Loading_Unloading': { x: 390, y: 540 },
        'Weight_Station_2': { x: 1170, y: 370 },
        'Office': { x: 1070, y: 724 },
        'Entrance2': { x: 1070, y: 760 },  // Right entrance - moved to right
      },
      // Warehouse badge positions
      warehouseBadgePositions: {
        'Anbar_PAK': { x: 1410, y: 470 },
        'Anbar_Sangin': { x: 845, y: 425 },
        'Anbar_Khamir_Kordan': { x: 1320, y: 75 },
        'Anbar_Khamir_Ghadim': { x: 655, y: 20 },
        'Anbar_Parvandeh': { x: 360, y: 75 },
        'Anbar_Koochak': { x: 360, y: 125 },
        'Anbar_Salon_Tolid': { x: 130, y: 20 },
        'Anbar_Akhal': { x: 300, y: 860 },
      },
      truckAnimations: {}, // Store animated positions { truckId: { currentX, currentY, rotation, animating } }
      animationFrames: {},  // Store RAF IDs for cleanup
      
      // Dialog state
      showInventoryDialog: false,
      dialogType: null, // 'products' or 'rawMaterials' or 'profiles'
      selectedWarehouse: null,
      selectedWarehouseDetails: null,
      loadingDetails: false,

      // ADD: Cargo Dialog state
      showCargoDialog: false,
      selectedShipment: null,
      loadingCargoDetails: false,

      truckAudios: {},  // Audio instance per truck
    }
  },
  computed: {
    /**
     * Get warehouse names for display
     */
    warehouseNames() {
      return Object.keys(this.warehouseBadgePositions)
    },
    
    /**
     * Get total inventory across all warehouses
     */
    totalInventory() {
      return Object.values(this.warehouseInventory).reduce((a, b) => a + b, 0)
    },
    
    /**
     * Get number of active loading/unloading operations
     */
    activeLoadingCount() {
      return this.activeShipments.filter(s => s.status === 'LoadingUnloading').length
    },
    
    /**
     * Count incoming shipments
     */
    incomingCount() {
      return this.activeShipments.filter(s => s.shipment_type === 'Incoming').length
    },
    
    /**
     * Count outgoing shipments
     */
    outgoingCount() {
      return this.activeShipments.filter(s => s.shipment_type === 'Outgoing').length
    },
    
    /**
     * Count registered (moving to W1) shipments
     */
    registeredCount() {
      return this.activeShipments.filter(s => s.status === 'Registered').length
    },
    
    /**
     * Count loaded/unloaded (moving to W2) shipments
     */
    loadedUnloadedCount() {
      return this.activeShipments.filter(s => s.status === 'LoadedUnloaded').length
    },
  },
  mounted() {
    console.log('FactoryMap component mounted successfully!')
    this.fetchMapData()
    this.startPolling()
    // this.initTruckAudio()

    document.addEventListener('click', () => {
      if (this.truckAudio) {
        this.truckAudio.play().then(() => {
          this.truckAudio.pause();
        }).catch(() => {});
      }
    }, { once: true })
  },
  beforeUnmount() {
    console.log('FactoryMap component unmounting')
    this.stopPolling()
  
    // Cancel all animations
    Object.values(this.animationFrames).forEach(frameId => {
      cancelAnimationFrame(frameId);
    });

    this.stopAllTruckSounds()
  },
  methods: {
    /**
     * Fetch all map data (shipments + inventory)
     */
    async fetchMapData() {
      this.loading = true
      this.error = null
      
      try {
        await Promise.all([
          this.fetchShipments(),
          this.fetchWarehouseInventory()
        ])
        this.lastUpdateTime = new Date()
        console.log('Map data fetched successfully')
      } catch (error) {
        console.error('Error fetching map data:', error)
        this.error = 'خطا در بارگذاری داده‌ها / Error loading data'
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch active shipments from backend
     */
    async fetchShipments() {
      try {
        const response = await axios.get('/myapp/api/getFactoryMapData')
        
        if (response.data.status === 'success') {
          this.activeShipments = response.data.data
          console.log(`✅ Loaded ${this.activeShipments.length} active shipments`)
          
          // Debug: Show truck workflow states with START → END positions
          if (this.activeShipments.length > 0) {
            console.log('📊 Shipment Workflow Motion (START → END):')
            console.log('='.repeat(80))
            this.activeShipments.forEach(s => {
              const startPos = this.getTruckStartPosition(s)
              const endPos = this.getTruckEndPosition(s)
              const rotation = this.getTruckRotation(s)
              const rotationDesc = rotation === 0 ? 'Horizontal' : rotation === 90 ? 'Right (W1)' : 'Downward (W2)'
              console.log(`🚚 ${s.license_number}:`)
              console.log(`   Status: ${s.status} | Type: ${s.shipment_type} | Location: ${s.location || 'N/A'}`)
              console.log(`   START: (${startPos.x}, ${startPos.y}) → END: (${endPos.x}, ${endPos.y})`)
              console.log(`   Rotation: ${rotation}° (${rotationDesc}) | Unload: ${s.unload_location || 'N/A'}`)
              console.log(`   Motion: ${startPos.x === endPos.x && startPos.y === endPos.y ? 'STOPPED (waiting)' : '🎬 MOVING SLOWLY (15 seconds)'}`)
              console.log('-'.repeat(80))
            })
          }
          
          // Debug: Check forklift conditions
          const loadingShipments = this.activeShipments.filter(s => s.status === 'LoadingUnloading')
          console.log(`🚜 Active Forklifts (WORKING): ${loadingShipments.length}`)
          console.log(`🚜 Static Forklifts (READY): 4 (always visible)`)
        } else {
          throw new Error(response.data.message || 'Failed to fetch shipments')
        }
      } catch (error) {
        console.error('Error fetching shipments:', error)
        throw error
      }
    },

    /**
     * Fetch warehouse inventory counts from backend
     */
    async fetchWarehouseInventory() {
      try {
        const response = await axios.get('/myapp/api/getWarehouseInventory')
        
        if (response.data.status === 'success') {
          // Store detailed data
          this.warehouseInventoryDetails = response.data.data
          
          // Create simple count map for backward compatibility
          const simpleCounts = {}
          Object.entries(response.data.data).forEach(([warehouse, data]) => {
            simpleCounts[warehouse] = data.total_count || 0
          })
          this.warehouseInventory = simpleCounts
          
          console.log('Loaded warehouse inventory:', this.warehouseInventory)
          console.log('Detailed warehouse inventory:', this.warehouseInventoryDetails)
        } else {
          throw new Error(response.data.message || 'Failed to fetch inventory')
        }
      } catch (error) {
        console.error('Error fetching warehouse inventory:', error)
        throw error
      }
    },

    /**
     * Start polling for updates every 60 seconds
     */
    startPolling() {
      this.pollingInterval = setInterval(() => {
        console.log('Auto-refreshing map data...')
        this.fetchMapData()
      }, 60000) // 60 seconds
    },

    /**
     * Stop polling
     */
    stopPolling() {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
        this.pollingInterval = null
      }
    },

    /**
     * Manual refresh handler
     */
    async handleRefresh() {
      console.log('Manual refresh clicked')
      await this.fetchMapData()
    },

    /**
     * Get truck START position (where truck begins its movement for current status)
     */
    getTruckStartPosition(shipment) {
      const status = shipment.status
      const type = shipment.shipment_type
      const unloadLocation = shipment.unload_location
      const material_type = shipment.material_type;
      
      // Determine START position based on workflow:
      
      // Registered → START at Entrance
      if (status === 'Registered') {
        if(type === 'Incoming') {
          if (material_type && material_type.indexOf('آخال') !== -1) {
            return this.truckStopPositions['Entrance2'] || { x: 1080, y: 800 }
          }
          else {
            return this.truckStopPositions['Entrance1'] || { x: 390, y: 800 }
          }
        } else {
          return this.truckStopPositions['Entrance1'] || { x: 390, y: 800 }
        }
      }
      
      // LoadingUnloading → Already at warehouse from previous step
      if (status === 'LoadingUnloading') {
        if (type === 'Incoming') {
          if(material_type && material_type.indexOf('آخال') !== -1) {
            return this.truckStopPositions['Weight_Station_2'] || { x: 1170, y: 370 }
          } else {
            return this.truckStopPositions['Weight_Station_1'] || { x: 390, y: 540 }
          }
        } else {
            return this.truckStopPositions['Weight_Station_1'] || { x: 390, y: 540 }
        }
      }
      
      // LoadedUnloaded → START at warehouse (where it was loading)
      if (status === 'LoadedUnloaded') {
        if (type === 'Incoming' && unloadLocation) {
          return this.truckStopPositions[unloadLocation] || this.truckStopPositions['Loading_Unloading']
        } else if (type === 'Outgoing') {
          return this.truckStopPositions['Anbar_Salon_Tolid'] || { x: 350, y: 300 }
        }
        return this.truckStopPositions['Weight_Station_1'] || { x: 390, y: 540 }
      }
      
      // Office → START at Weight Station 2
      if (status === 'Office') {
        if(type === 'Incoming') {
          if(material_type && material_type.indexOf('آخال') !== -1) {
            return this.truckStopPositions['Entrance2'] || { x: 1170, y: 370 }
          }
          else {
            return this.truckStopPositions['Entrance1'] || { x: 390, y: 540 }
          }
        }
        else {
          return this.truckStopPositions['Weight_Station_2'] || { x: 390, y: 540 }
        }
      }
      
      // Delivered → START at Office
      if (status === 'Delivered') {
        if(type === 'Incoming') {
          if(material_type && material_type.indexOf('آخال') !== -1) {
            return this.truckStopPositions['Entrance2'] || { x: 1070, y: 724 }
          }
          else {
            return this.truckStopPositions['Entrance1'] || { x: 390, y: 724 }
          }
        } 
        else {
          return this.truckStopPositions['Entrance1'] || { x: 390, y: 724 }
        }
      }
      
      // Default
      return this.truckStopPositions['Entrance1'] || { x: 390, y: 775 }
    },
    
    /**
     * Get truck END position (where truck should stop and wait)
     */
    getTruckEndPosition(shipment) {
      const status = shipment.status
      const type = shipment.shipment_type
      const location = shipment.location
      const unloadLocation = shipment.unload_location
      const material_type = shipment.material_type;
      
      // Determine END position based on workflow:
      
      // 1. Registered → END at Weight Station 1 (stops and waits)
      if (status === 'Registered') {
        if(type === 'Incoming') {
          if(material_type && material_type.indexOf('آخال') !== -1) {
            return this.truckStopPositions['Weight_Station_2'] || { x: 1170, y: 370 }
          }
          else {
            return this.truckStopPositions['Weight_Station_1'] || { x: 390, y: 560 }
          }
        } else {
          return this.truckStopPositions['Weight_Station_1'] || { x: 390, y: 560 }
        }
      }
      
      // 2. LoadingUnloading → END at warehouse (stops for loading)
      if (status === 'LoadingUnloading') {
        if (type === 'Incoming') {
          if(material_type && material_type.indexOf('آخال') !== -1) {
            switch(unloadLocation) {
                case 'Anbar_Khamir_Kordan':
                  return this.truckStopPositions['Anbar_Khamir_Kordan'] || { x: 200, y: 1170 }
                case 'Anbar_Mohavate_Kardan':
                  return this.truckStopPositions['Anbar_Mohavate_Kardan'] || { x: 150, y: 1050 }
                case 'Anbar_Akhal':
                  return this.truckStopPositions['Anbar_Akhal'] || { x: 120, y: 830 }
                default: 
                  return this.truckStopPositions['Weight_Station_2'] || { x: 1170, y: 370 }
            }
          }
          else if(material_type && material_type.indexOf('لوله مقوایی') !== -1) {
            return this.truckStopPositions['Anbar_Salon_Tolid'] || { x: 350, y: 237 }
          }
          else
            return this.truckStopPositions[unloadLocation] || this.truckStopPositions['Loading_Unloading']
        } 
        else {
          switch(unloadLocation) {
            case 'Anbar_Salon_Tolid':
              return this.truckStopPositions['Anbar_Salon_Tolid'] || { x: 350, y: 300 }
            case 'Anbar_Sangin':
              return this.truckStopPositions['Anbar_Sangin'] || { x: 660, y: 560 }
            case 'Anbar_Khamir_Ghadim':
              return this.truckStopPositions['Anbar_Khamir_Ghadim'] || { x: 700, y: 150 }
            default: 
              return this.truckStopPositions['Weight_Station_1'] || { x: 390, y: 560 }
          }
        }        
      }
      
      // 3. LoadedUnloaded → END at Weight Station 2 (stops and waits)
      if (status === 'LoadedUnloaded') {
        if(material_type && material_type.indexOf('آخال') !== -1) {
          return this.truckStopPositions['Weight_Station_2'] || { x: 1170, y: 370 }
        }
        else {
          return this.truckStopPositions['Weight_Station_1'] || { x: 350, y: 560 }
        }
      }
      
      // 4. Office → END at Office
      if (status === 'Office') {
        if(material_type && material_type.indexOf('آخال') !== -1) {
          return this.truckStopPositions['Entrance2'] || { x: 1050, y: 760 }
        }
        else {
          return this.truckStopPositions['Entrance1'] || { x: 400, y: 760 }
        }
      }
      
      // 5. Delivered → END at street (exits)
      if (status === 'Delivered') {
        return { x: 0, y: 820 }
      }
      
      // Use location field if set
      if (location && this.truckStopPositions[location]) {
        return this.truckStopPositions[location]
      }
      
      // Default
      return this.truckStopPositions['Weight_Station_1'] || { x: 320, y: 610 }
    },
    
    /**
     * Get truck position (uses END position - where it should be)
     */
    getTruckPosition(shipment) {
      return this.getTruckEndPosition(shipment)
    },
    
    /**
     * Get truck rotation based on position and status
     */
    getTruckRotation(shipment) {
      const type = shipment.shipment_type
      const status = shipment.status
      const location = shipment.location
      
      // Weight Station 1: Head pointing right (90 degrees)
      if (status === 'Registered') {
        return 0
      }

      if (location === 'Loading_Unloading') {
        if (type === 'Incoming') {
          return 0
        } else if (type === 'Outgoing') {
          return 0
        }
      }

      // Weight Station 2: Head pointing toward entrance (0 degrees)
      if (status === 'LoadedUnloaded' || location === 'Weight_Station_2') {
        return 0
      }
      
      // Horizontal for loading/unloading and other positions
      return 0
    },

    /**
     * Get truck color based on shipment type
     */
    getTruckColor(shipment) {
      if (shipment.status === 'LoadingUnloading') {
        return { fill: '#ffcccc', stroke: '#cc0000' } // Orange/Red for loading
      }
      if (shipment.shipment_type === 'Incoming') {
        return { fill: '#90ee90', stroke: '#228b22' } // Green
      }
      return { fill: '#90caf9', stroke: '#1976d2' } // Blue for outgoing
    },

    /**
     * Determine if truck should show cargo based on shipment type and status
     */
    truckHasCargo(shipment) {
      const type = shipment.shipment_type;
      const status = shipment.status;
      
      if (type === 'Incoming') {
        // Incoming: has cargo when arriving and during unloading
        // Loses cargo after being unloaded
        return status === 'Registered' || status === 'LoadingUnloading';
      } else {
        // Outgoing: no cargo when arriving
        // Gets cargo after being loaded
        return status === 'LoadedUnloaded' || status === 'Office' || status === 'Delivered';
      }
    },

    /**
     * Get warehouse inventory count
     */
    getWarehouseCount(warehouseName) {
      return this.warehouseInventory[warehouseName] || 0
    },

    /**
     * Get warehouse total weight in kg
     */
    getWarehouseWeight(warehouseName) {
      const details = this.warehouseInventoryDetails[warehouseName]
      return details ? details.total_weight : 0
    },

    /**
     * Get warehouse products weight in kg
     */
    getWarehouseProductsWeight(warehouseName) {
      const details = this.warehouseInventoryDetails[warehouseName]
      const weight = details && details.products ? details.products.weight : 0
      // console.log(`🟢 Products weight for ${warehouseName}:`, weight, details)
      return weight
    },

    /**
     * Get warehouse raw materials weight in kg
     */
    getWarehouseRawMaterialsWeight(warehouseName) {
      const details = this.warehouseInventoryDetails[warehouseName]
      const weight = details && details.raw_materials ? details.raw_materials.weight : 0
      // console.log(`🟠 Raw materials weight for ${warehouseName}:`, weight, details)
      return weight
    },

    /**
     * Format warehouse display name
     */
    formatWarehouseName(name) {
      return name.replace('Anbar_', '').replace(/_/g, ' ')
    },
    
    /**
     * Format weight for display (with units)
     */
    formatWeight(weight) {
      const numWeight = Number(weight) || 0
      return numWeight.toFixed(1) + 't'    
    },

    /**
     * Animate truck along a path with waypoints
     */
    animateTruckAlongPath(shipment, waypoints) {
      console.log('🎬 -----------------------------------------------------')
      console.log('🎬 Animate truck along path', shipment, waypoints)
      if (!waypoints || waypoints.length < 2) return;
      
      const truckId = shipment.id;
      let currentWaypointIndex = 0;
      
      // START SOUND FOR THIS TRUCK
      this.playTruckSound(truckId);

      const animateSegment = () => {
        if (currentWaypointIndex >= waypoints.length - 1) {
          // Animation complete
          if (this.truckAnimations[truckId]) {
            this.truckAnimations[truckId].animating = false;
      
            // If Delivered and reached the end, mark for hiding
            if (shipment.status === 'Delivered') {
              this.truckAnimations[truckId].exited = true;
            }          
          }

          // STOP SOUND FOR THIS TRUCK
          this.stopTruckSound(truckId);

          return;
        }
        
        const start = waypoints[currentWaypointIndex];
        const end = waypoints[currentWaypointIndex + 1];
        const duration = 3000; // 3 seconds per segment
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing function
          const easeProgress = progress < 0.5 
            ? 2 * progress * progress 
            : -1 + (4 - 2 * progress) * progress;
          
          const currentX = start.x + (end.x - start.x) * easeProgress;
          const currentY = start.y + (end.y - start.y) * easeProgress;
          
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          
          // Calculate rotation based on movement direction
          let rotation;
          const movingLeft = dx < 0;

          if (Math.abs(dy) > Math.abs(dx) * 2) {
            // Primarily vertical movement
            rotation = dy < 0 ? -90 : 90;  // Up = -90°, Down = 90°
          } else if (Math.abs(dx) > Math.abs(dy) * 2) {
            // Primarily horizontal movement
            rotation = dx < 0 ? 180 : 0;  // Left = 180°, Right = 0°
          } else {
            // Diagonal movement - calculate actual angle
            rotation = Math.atan2(dy, dx) * (180 / Math.PI);
          }

          // Adjust rotation for ALL left-moving trucks (they are flipped with scale(-1, 1))
          // Formula: after flip, visual_angle = 180° + applied_rotation
          // So: applied_rotation = target_angle - 180°
          if (movingLeft) {
            rotation = rotation - 180;
          }
          this.truckAnimations[truckId] = {
            currentX,
            currentY,
            rotation,
            animating: true,
            exited: false,
            movingLeft
          };

          // const rotation = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

          // // Determine if moving left (for flipping the truck image)
          // const dx = end.x - start.x;
          // const movingLeft = dx < 0;
          // console.log('🎬 movingLeft', movingLeft)
          // // Update animation state
          // this.truckAnimations[truckId] = {
          //   currentX,
          //   currentY,
          //   rotation: movingLeft ? 0 : rotation,  // No rotation needed anymore
          //   animating: true,
          //   exited: false,
          //   movingLeft: movingLeft  // Track direction for flipping
          // };
          
          if (progress < 1) {
            this.animationFrames[truckId] = requestAnimationFrame(animate);
          } else {
            // Move to next segment after small pause
            currentWaypointIndex++;
            setTimeout(animateSegment, 300);
          }
        };
        
        animate();
      };
      
      animateSegment();
      console.log('🎬 -----------------------------------------------------')
    },  

    /**
     * Get waypoints path based on shipment status
     */
    getWaypointsForShipment(shipment, currentPos = null) {
      const status = shipment.status;
      const type = shipment.shipment_type;
      const unload_location = shipment.unload_location;
      const material_type = shipment.material_type;

      switch(status) {
        case 'Registered':
          if(type === 'Incoming') {
            if(material_type && material_type.indexOf('آخال') !== -1) {
              return [
                { x: 0, y: 820 },     // Street
                { x: 1050, y: 820 },  // Entrance2
                { x: 1170, y: 370 }   // W2          
              ];
            }
            else {
              return [
                { x: 0, y: 820 },    // Street
                { x: 390, y: 820 },  // Entrance1
                { x: 390, y: 540 }   // W1
              ];
            }
          } else {
            return [
              { x: 0, y: 820 },    // Street
              { x: 390, y: 820 },  // Entrance1
              { x: 390, y: 540 }   // W1
            ];
          }
        case'LoadingUnloading':
          if (type === 'Incoming') {
            if(material_type && material_type.indexOf('لوله مقوایی') !== -1) {
              return [
                { x: 390, y: 540 },  // W1
                { x: 350, y: 260 }   // Anbar Salon Tolid
              ];
            }
            else {
              switch(unload_location) {
                case 'Anbar_Salon_Tolid':
                  return [
                    { x: 390, y: 540 },  // W1
                    { x: 350, y: 260 }   // W1
                  ];
                case 'Anbar_Sangin':
                  return [
                    { x: 390, y: 540 },  // W1
                    { x: 350, y: 310 },   // turn right towards anbar sangin
                    { x: 800, y: 310 },   // reach anbar sangin
                  ];
                case 'Anbar_Koochak':
                  return [
                    { x: 390, y: 540 },  // W1
                    { x: 350, y: 260 },  // turn right towards anbar koochak
                    { x: 360, y: 260 },  // turn left towards anbar koochak
                    { x: 360, y: 150 },  // Anbar koochak
                  ];
                case'Anbar_Parvandeh':
                  return [
                    { x: 390, y: 540 },  // W1
                    { x: 350, y: 260 },  // turn right towards anbar Parvandeh
                    { x: 360, y: 260 },  // turn left towards anbar Parvandeh
                    { x: 360, y: 120 },  // Anbar Parvandeh            
                  ];
                case 'Anbar_Mohavath_Homayoun':
                  return [
                    { x: 390, y: 540 },  // W1
                    { x: 350, y: 260 },  // turn right towards anbar Mohavath_Homayoun
                    { x: 460, y: 260 },  // turn left towards anbar Mohavath_Homayoun
                    { x: 460, y: 200 },  // Anbar Mohavath_Homayoun            
                  ];
                case 'Anbar_Khamir_Ghadim':
                  return [
                    { x: 390, y: 540 },  // W1
                    { x: 350, y: 260 },  // turn right towards anbar Mohavath_Homayoun
                    { x: 600, y: 260 },  // turn left towards anbar Mohavath_Homayoun
                    { x: 600, y: 150 },  // Anbar Mohavath_Homayoun            
                    ];
                case 'Anbar_Muhvateh_Kardan':
                  return [
                    { x: 1170, y: 370 },    // W2
                    { x: 1170, y: 150 },    // Anbar Muhvateh Kordan  
                  ];
                case 'Anbar_Khamir_Kordan':
                  return [
                    { x: 1170, y: 370 },    // W2
                    { x: 1170, y: 200 },    // Anbar KHamir Kordan  
                  ];
                case 'Anbar_PAK':
                  return [
                    { x: 390, y: 540 },  // W1
                    { x: 350, y: 820 },  // towards out of factory
                    { x: 1350, y: 820 }, // Start from current or W1
                  ];
                case 'Anbar_Akhal':
                  return [
                    { x: 390, y: 540 },  // W1
                    { x: 350, y: 830 },  // towards out of factory
                    { x: 120, y: 830 },  // Start from current or W1
                  ];
                default: 
                  if(material_type && material_type.indexOf('آخال') !== -1) {
                    return [
                      { x: 1170, y: 370 }   // W2          
                    ];
                  }
                  else {
                    return [
                      { x: 390, y: 540 }   // W1
                    ];
                  }
              }
            }
          }
          else {
            switch(unload_location) {
                case 'Anbar_Salon_Tolid':
                  return [
                    { x: 390, y: 540 },  // Mid 670
                    { x: 350, y: 300 }   // W1
                  ];
                case 'Anbar_Sangin':
                  return [
                    { x: 390, y: 540 },   // w1
                    { x: 390, y: 300 },   // turn right towards anbar sangin
                    { x: 660, y: 300 },   // reach anbar sangin
                    { x: 660, y: 560 },   // turn right towards W1
                  ];
                case 'Anbar_Khamir_Ghadim':
                  return [
                    { x: 390, y: 540 },  // W1
                    { x: 350, y: 260 },  // turn right towards anbar Mohavath_Homayoun
                    { x: 600, y: 260 },  // turn left towards anbar Mohavath_Homayoun
                    { x: 600, y: 150 },  // Anbar Mohavath_Homayoun            
                  ];
                default: 
                  return [
                    { x: 350, y: 580 },  // W1
                  ]
            }
          }
        case 'LoadedUnloaded':
          //const start = currentPos || this.truckStopPositions[shipment.unload_location] || { x: 510, y: 610 };
          // For incoming trucks, follow the GREEN path with proper waypoints
          if (type === 'Incoming') {
            switch(unload_location) {
              case 'Anbar_Salon_Tolid':
                return [
                  { x: 350, y: 260 },     // Anbar Salon Tolid
                  { x: 350, y: 580 },    // W1
                ];
              case 'Anbar_Sangin':
                return [
                  { x: 660, y: 570 },     // anbar sangin
                  { x: 660, y: 750 },    // Before turning left
                  { x: 390, y: 750 },     // Turn right towards W1
                  { x: 390, y: 540 }     // Turn right towards W1
                ];
              case 'Anbar_Koochak':
                return [
                  { x: 360, y: 150 },     // Anbar koochak
                  { x: 360, y: 260 },     // turn right 
                  { x: 350, y: 260 },    // Before turning left
                  { x: 350, y: 580 }     // Turn left towards W1
                ];
              case'Anbar_Parvandeh':
                return [
                  { x: 360, y: 120 },     // Anbar Parvandeh            
                  { x: 360, y: 260 },     // turn right 
                  { x: 350, y: 260 },    // Before turning left
                  { x: 350, y: 580 }     // Turn left towards W1
                ];
              case 'Anbar_Mohavath_Homayoun':
                return [
                  { x: 460, y: 200 },  // Anbar Mohavath_Homayoun            
                  { x: 460, y: 260 },  // turn right
                  { x: 350, y: 260 },    // Before turning left
                  { x: 350, y: 580 }     // Turn left towards W1
                ];
              case 'Anbar_Khamir_Ghadim':
                return [
                  { x: 600, y: 150 },  // Anbar Mohavath_Homayoun            
                  { x: 600, y: 260 },  // turn right 
                  { x: 350, y: 260 },    // Before turning left
                  { x: 350, y: 580 }     // Turn left towards W1
                ];
              case 'Anbar_Muhvateh_Kardan':
                return [
                  { x: 1100, y: 180 },  // move backward to Anbar_Khamir_Kordan     
                  { x: 1170, y: 260 },    // Before turning right
                  { x: 1170, y: 370 }     // Turn right towards W2
                ];
              case 'Anbar_Khamir_Kordan':
                return [
                  { x: 1170, y: 150 },  //  Anbar_Khamir_Kordan     
                  { x: 1170, y: 300 }     //  W2
                ];
              case 'Anbar_PAK':
                return [
                  { x: 1320, y: 820 },   // towards out of factory
                  { x: 1020, y: 820 },   // turn right
                  { x: 1170, y: 370 }     //  W2
                ];
              case 'Anbar_Akhal':
                return [
                  { x: 120, y: 830 },  // Start from current or W1
                  { x: 1020, y: 820 },   // turn right
                  { x: 1080, y: 370 }     //  W2

                ];
              default: 
                return [
                  { x: 1170, y: 370 },  // W2
                ]
            }
          }
          else {
            switch(unload_location) {
              case 'Anbar_Salon_Tolid':
                return [
                  { x: 350, y: 300 },   // Anbar Salon Tolid
                  { x: 390, y: 540 },  // W1
                ];               
              case 'Anbar_Sangin':
                return [
                  { x: 660, y: 560 },   // anbar sangin
                  { x: 660, y: 300 },   // turn left 
                  { x: 390, y: 300 },   // turn left towards W1
                  { x: 390, y: 540 },   // W1
                ];
              case 'Anbar_Khamir_Ghadim':
                return [
                  { x: 600, y: 200 },  // Anbar Mohavath Kordan            
                  { x: 600, y: 300 },  // turn right towards anbar salon tolid
                  { x: 390, y: 300 },  // turn left towards W1
                  { x: 390, y: 540 },  // W1
                ];
              default: 
                return [
                  { x: 390, y: 540 },  // W1
                ]
            }
          }
        case 'Office':
          if (type === 'Incoming') {
            if(material_type && material_type.indexOf('آخال') !== -1) {
              return [
                currentPos || { x: 1170, y: 370 },
                { x: 1140, y: 410 },
                { x: 1070, y: 724 },
              ];
            } else {
              return [
                currentPos || { x: 390, y: 540 },
                { x: 390, y: 540 },
                { x: 390, y: 724 },
              ];            
            }        
          } else {
            return [
                currentPos || { x: 390, y: 540 },
                { x: 390, y: 540 },
                { x: 390, y: 724 },
              ];            
          }
        case 'Delivered':
          if (type === 'Incoming') {
            if(material_type && material_type.indexOf('آخال') !== -1) {
              return [
                currentPos || { x: 1070, y: 724 },
                { x: 1070, y: 820 },   // Street
                { x: 0, y: 820 }   // Street
              ];
            } else {
              return [
                currentPos || { x: 390, y: 724 },
                { x: 390, y: 820 },   // Street
                { x: 0, y: 820 }   // Street
              ];            
            }        
          } else {
            return [
                currentPos || { x: 390, y: 724 },
                { x: 390, y: 820 }, 
                { x: 0, y: 820 }   // Street
              ];            
          }          
        default:
            return [];
      }
    },  

    /**
     * Get animated truck position (or default to end position)
     */
    getAnimatedTruckPosition(shipment) {
      const animation = this.truckAnimations[shipment.id];
      // Use stored position if available (even if not currently animating)
      if (animation && animation.currentX !== undefined && animation.currentY !== undefined) {
        return { x: animation.currentX, y: animation.currentY };
      }
      return this.getTruckEndPosition(shipment);
    },
  
    /**
     * Get animated truck rotation
     */
    getAnimatedTruckRotation(shipment) {
      const animation = this.truckAnimations[shipment.id];
      console.log('🔄 getAnimatedTruckRotation:', {
        id: shipment.id,
        animation: animation,
        rotation: animation?.rotation,
        hasRotation: animation?.rotation !== undefined
      });
      
      if (animation && animation.rotation !== undefined) {
        return animation.rotation;
      }
      return this.getTruckRotation(shipment);
    },

    /**
     * Check if truck is moving left (to flip the image)
     */
    isTruckMovingLeft(shipment) {
      const animation = this.truckAnimations[shipment.id];
      if (animation && animation.movingLeft !== undefined) {
        return animation.movingLeft;
      }
      // Default: check based on status
      // Delivered trucks exit to the left
      if (shipment.status === 'Delivered') {
        return true;
      }
      return false;
    },

    /**
     * Open Products Dialog (Green Circle Click)
     */
    async openProductsDialog(warehouseName) {
      console.log('Opening products dialog for:', warehouseName)
      this.selectedWarehouse = warehouseName
      this.dialogType = 'products'
      this.loadingDetails = true
      this.showInventoryDialog = true
      
      try {
        const response = await axios.get(`/myapp/api/getWarehouseInventoryDetails?warehouse=${warehouseName}`)
        if (response.data.status === 'success') {
          this.selectedWarehouseDetails = response.data
          console.log('Loaded warehouse details:', response.data)
        }
      } catch (error) {
        console.error('Error fetching warehouse details:', error)
        this.selectedWarehouseDetails = null
      } finally {
        this.loadingDetails = false
      }
    },

    /**
     * Open Raw Materials / Profiles Dialog (Orange Circle Click)
     */
    async openRawMaterialsDialog(warehouseName) {
      console.log('Opening raw materials dialog for:', warehouseName)
      this.selectedWarehouse = warehouseName
      this.dialogType = warehouseName === 'Anbar_Salon_Tolid' ? 'profiles' : 'rawMaterials'
      this.loadingDetails = true
      this.showInventoryDialog = true
      
      try {
        const response = await axios.get(`/myapp/api/getWarehouseInventoryDetails?warehouse=${warehouseName}`)
        if (response.data.status === 'success') {
          this.selectedWarehouseDetails = response.data
          console.log('Loaded warehouse details:', response.data)
        }
      } catch (error) {
        console.error('Error fetching warehouse details:', error)
        this.selectedWarehouseDetails = null
      } finally {
        this.loadingDetails = false
      }
    },

    /**
     * Close inventory dialog
     */
    closeInventoryDialog() {
      this.showInventoryDialog = false
      this.selectedWarehouse = null
      this.selectedWarehouseDetails = null
      this.dialogType = null
    },

    /**
     * Open Cargo Dialog when clicking on truck cargo
     * Fetches fresh data from backend
     */
     async openCargoDialog(shipment) {
      console.log('Opening cargo dialog for shipment ID:', shipment.id)
      this.showCargoDialog = true
      this.loadingCargoDetails = true
      this.selectedShipment = null  // Clear previous data
      
      try {
        const response = await axios.get(`/myapp/api/getShipmentCargoDetails?shipment_id=${shipment.id}`)
        
        if (response.data.status === 'success') {
          this.selectedShipment = response.data.data
          console.log('Loaded fresh cargo details:', this.selectedShipment)
        } else {
          console.error('Failed to fetch cargo details:', response.data.message)
          // Fallback to cached data if API fails
          this.selectedShipment = shipment
        }
      } catch (error) {
        console.error('Error fetching cargo details:', error)
        // Fallback to cached data if API fails
        this.selectedShipment = shipment
      } finally {
        this.loadingCargoDetails = false
      }
    },

    /**
     * Close cargo dialog
     */
    closeCargoDialog() {
      this.showCargoDialog = false
      this.selectedShipment = null
      this.loadingCargoDetails = false    
    },

    /**
     * Parse list of reels into array
     */
    parseReelsList(listOfReels) {
      if (!listOfReels) return []
      return listOfReels.replace(/\s/g, '').split(',').filter(r => r)
    },
    /**
     * Get cylinder height based on count (for visualization)
     */
    getCylinderHeight(count, maxCount) {
      const minHeight = 40
      const maxHeight = 120
      if (!maxCount || maxCount === 0) return minHeight
      return minHeight + ((count / maxCount) * (maxHeight - minHeight))
    },

    /**
     * Get cube size based on count (for visualization)
     */
    getCubeSize(count, maxCount) {
      const minSize = 50
      const maxSize = 100
      if (!maxCount || maxCount === 0) return minSize
      return minSize + ((count / maxCount) * (maxSize - minSize))
    },

    /**
     * Get max count from array safely
     */
    getMaxCount(items, key = 'count') {
      if (!items || items.length === 0) return 1
      return Math.max(...items.map(i => i[key] || 0), 1)
    },

    /**
     * Play truck sound
     */
    playTruckSound(truckId) {
      if (!this.truckAudios[truckId]) {
        this.truckAudios[truckId] = new Audio('/static/sounds/mixkit-tractor-driving-away-1599.wav');
        this.truckAudios[truckId].loop = true;
        this.truckAudios[truckId].volume = 0.3;

        // Play the audio
        this.truckAudios[truckId].currentTime = 0;
        this.truckAudios[truckId].play().catch(err => {
          console.log('Audio play failed for truck ' + truckId + ':', err);
        });
      }
    },

    /**
     * Stop truck sound for a specific truck
     */
    stopTruckSound(truckId) {
      if (this.truckAudios[truckId]) {
        this.truckAudios[truckId].pause();
        this.truckAudios[truckId].currentTime = 0;
      }
    },

    /**
     * Stop all truck sounds
     */
    stopAllTruckSounds() {
      Object.keys(this.truckAudios).forEach(truckId => {
        this.stopTruckSound(truckId);
      });
    },

    /**
     * Check if any truck is currently animating
     */
    isAnyTruckMoving() {
      return Object.values(this.truckAnimations).some(anim => anim && anim.animating);
    },

    /**
     * Get the previous status in the workflow
     */
    getPreviousStatus(currentStatus) {
      const workflow = {
        'LoadingUnloading': 'Registered',
        'LoadedUnloaded': 'LoadingUnloading',
        'Office': 'LoadedUnloaded',
        'Delivered': 'Office'
      };
      return workflow[currentStatus] || null;
    },
  },
  watch: {
    activeShipments: {
      handler(newShipments, oldShipments) {
        // console.log('🎬 Watch triggered: activeShipments changed', {
        //   new: newShipments?.length,
        //   old: oldShipments?.length
        // })
        
        newShipments.forEach(shipment => {
          // Check if truck status changed or is new
          const oldShipment = oldShipments?.find(s => s.id === shipment.id);
          
          // Trigger animation if: new shipment, status changed, unload_location changed, OR initial load (no oldShipments)
          const unloadLocationChanged = oldShipment && oldShipment.unload_location !== shipment.unload_location;
          if (!oldShipment || oldShipment.status !== shipment.status || unloadLocationChanged || !oldShipments) {
            // console.log(`🚚 Starting animation for ${shipment.license_number} (status: ${shipment.status})`)
            
            // Get current animation state (if any)
            const currentAnimation = this.truckAnimations[shipment.id];
            const currentPos = currentAnimation ? 
              { x: currentAnimation.currentX, y: currentAnimation.currentY } : 
              null;  

            // Status changed - start animation
            const waypoints = this.getWaypointsForShipment(shipment, currentPos);

            if (waypoints.length > 0) {
              // Cancel any existing animation
              if (this.animationFrames[shipment.id]) {
                cancelAnimationFrame(this.animationFrames[shipment.id]);
              }

              // Only start animation if we have at least 2 waypoints
              if(waypoints.length > 1) {
                // Initialize position at start
                this.truckAnimations[shipment.id] = {
                  currentX: waypoints[0].x,
                  currentY: waypoints[0].y,
                  rotation: currentAnimation?.rotation || 0,
                  animating: false
                };
                
                // Start animation after small delay
                setTimeout(() => {
                  this.animateTruckAlongPath(shipment, waypoints);
                }, 100);
              } else {
                // Only 1 waypoint - keep truck at that position but preserve rotation
                if (!this.truckAnimations[shipment.id]) {
                  this.truckAnimations[shipment.id] = {};
                }
                // Update position but preserve rotation
                this.truckAnimations[shipment.id].currentX = waypoints[0].x;
                this.truckAnimations[shipment.id].currentY = waypoints[0].y;
                this.truckAnimations[shipment.id].animating = false;
                // Keep existing rotation and movingLeft - don't overwrite!

                // If no rotation exists, calculate based on how truck arrived at this position
                if (this.truckAnimations[shipment.id].rotation === undefined) {
                  // Get the previous status waypoints to determine arrival direction
                  const prevStatus = this.getPreviousStatus(shipment.status);
                  if (prevStatus) {
                    const prevShipment = { ...shipment, status: prevStatus };
                    const prevWaypoints = this.getWaypointsForShipment(prevShipment);
                    if (prevWaypoints.length >= 2) {
                      const lastSegmentStart = prevWaypoints[prevWaypoints.length - 2];
                      const lastSegmentEnd = prevWaypoints[prevWaypoints.length - 1];
                      const dx = lastSegmentEnd.x - lastSegmentStart.x;
                      const dy = lastSegmentEnd.y - lastSegmentStart.y;
                      
                      if (Math.abs(dy) > Math.abs(dx) * 2) {
                        this.truckAnimations[shipment.id].rotation = dy < 0 ? -90 : 90;
                      } else {
                        this.truckAnimations[shipment.id].rotation = 0;
                      }
                      this.truckAnimations[shipment.id].movingLeft = dx < 0;
                    } else {
                      this.truckAnimations[shipment.id].rotation = 0;
                    }
                  } else {
                    this.truckAnimations[shipment.id].rotation = 0;
                  }
                }
              }
            }
          } else {
            //console.warn(`⚠️ No waypoints for ${shipment.license_number}`)
          }
        });
      },
      deep: true,
      immediate: true  // ← ADD THIS LINE! Triggers on initial load
    }
  }
}

</script>

<template>
  <div class="factory-map-container">
    <!-- Error Display -->
    <div v-if="error" class="error-banner">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>در حال بارگذاری نقشه...</p>
    </div>

    <!-- Main SVG Map Container -->
    <div class="svg-container">
      <svg 
        viewBox="0 0 1700 1000" 
        preserveAspectRatio="xMidYMid meet"
        class="factory-svg"
      >
        <!-- Background -->
        <rect x="0" y="0" width="1700" height="1000" fill="#ffffff" />
        
        <!-- Factory outer boundary (bottom moved up 42px: 825-42=783) -->
        <rect x="40" y="10" width="1340" height="773" fill="none" stroke="#000" stroke-width="3" />
        
        <!-- Street area (moved up 42px, sticks to factory bottom) -->
        <rect x="0" y="783" width="1700" height="60" fill="#999" stroke="#666" stroke-width="2" />
        <text x="850" y="818" text-anchor="middle" font-size="16" font-weight="bold" fill="#fff">STREET</text>
        
        <!-- Anbar Salon Tolid -->
        <g class="anbar-salon-tolid">
          <rect x="40" y="10" width="200" height="420" fill="none" stroke="#000" stroke-width="2" />
          <text x="140" y="420" text-anchor="middle" font-size="12" font-weight="bold">Anbar Salon Tolid</text>
          
          <!-- PM3 Area (increased width, equal gaps on sides and between) -->
          <rect x="50" y="15" width="63" height="230" fill="#f5f5f5" stroke="#000" stroke-width="2" />
          <!-- Top empty square -->
          <rect x="55" y="20" width="53" height="53" fill="#fff" stroke="#000" stroke-width="1.5" />
          <!-- Bottom empty square -->
          <rect x="55" y="187" width="53" height="53" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="81" y="140" text-anchor="middle" font-size="12" font-weight="bold">PM3</text>
          
          <!-- PM2 Area (30% narrower: 63 * 0.7 = 44) -->
          <rect x="185" y="15" width="45" height="140" fill="#f5f5f5" stroke="#000" stroke-width="2" />
          <!-- Top empty square -->
          <rect x="190" y="20" width="36" height="36" fill="#fff" stroke="#000" stroke-width="1.5" />
          <!-- Bottom empty square -->
          <rect x="190" y="109" width="36" height="36" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="208" y="90" text-anchor="middle" font-size="12" font-weight="bold">PM2</text>
          
          <!-- Cylinders in Anbar Salon Tolid (2 rows, 3 cylinders, moved up with gap above text, all surfaces white) -->
          <!-- Row 1 -->
          <ellipse cx="90" cy="350" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 80,350 L 80,320 L 100,320 L 100,350" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="90" cy="320" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="115" cy="350" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 105,350 L 105,320 L 125,320 L 125,350" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="115" cy="320" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="140" cy="350" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 130,350 L 130,320 L 150,320 L 150,350" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="140" cy="320" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="165" cy="350" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 155,350 L 155,320 L 175,320 L 175,350" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="165" cy="320" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />

          <ellipse cx="190" cy="350" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 180,350 L 180,320 L 200,320 L 200,350" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="190" cy="320" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />

          <!-- Row 2 -->
          <ellipse cx="90" cy="390" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 80,390 L 80,360 L 100,360 L 100,390" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="90" cy="360" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="115" cy="390" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 105,390 L 105,360 L 125,360 L 125,390" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="115" cy="360" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="140" cy="390" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 130,390 L 130,360 L 150,360 L 150,390" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="140" cy="360" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />

          <ellipse cx="165" cy="390" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 155,390 L 155,360 L 175,360 L 175,390" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="165" cy="360" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="190" cy="390" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 180,390 L 180,360 L 200,360 L 200,390" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="190" cy="360" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />

        </g>

        <!-- Restaurant -->
        <g class="restaurant">
          <rect x="40" y="440" width="200" height="150" fill="none" stroke="#000" stroke-width="2" />
          <text x="140" y="520" text-anchor="middle" font-size="12" font-weight="bold" fill="#000">Restaurant</text>
        </g>

        <!-- Otagh Estrahat -->
        <g class="restaurant">
          <rect x="120" y="600" width="120" height="120" fill="none" stroke="#000" stroke-width="2" />
          <text x="180" y="665" text-anchor="middle" font-size="12" font-weight="bold" fill="#000">Otagh Estrahat</text>
        </g>

        <!-- Anbar Parvandeh -->
        <g class="anbar-parvandeh">
          <rect x="240" y="69" width="190" height="50" fill="none" stroke="#000" stroke-width="2" />
          <text x="335" y="103" text-anchor="middle" font-size="11" font-weight="bold">Anbar Parvandeh</text>
        </g>

        <!-- Anbar Koochak -->
        <g class="anbar-koochak">
          <rect x="240" y="119" width="190" height="104" fill="none" stroke="#000" stroke-width="2" />
          <text x="335" y="210" text-anchor="middle" font-size="11" font-weight="bold">Anbar Koochak</text>
          
          <!-- Pallet A 22 cube -->
          <g transform="translate(305, 150)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="24" text-anchor="middle" font-size="7" font-weight="bold">Pallet</text>
            <text x="25" y="32" text-anchor="middle" font-size="7" font-weight="bold">A</text>
            <text x="25" y="40" text-anchor="middle" font-size="7" font-weight="bold">22</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
        </g>

        <!-- Anbar Khamir Ghadim -->
        <g class="anbar-khamir-ghadim">
          <path d="M 710,69 L 240,69 L 240,10 L 900,10 L 900,69" fill="none" stroke="#000" stroke-width="2" />
          <path d="M 710,69 L 710,123 L 900,123 L 900,69" fill="none" stroke="#000" stroke-width="2" />
          <path d="M 710,123 L 710,173 L 900,173 L 900,123" fill="none" stroke="#000" stroke-width="2" />
          <path d="M 710,173 L 710,223 L 900,223 L 900,173" fill="none" stroke="#000" stroke-width="2" />
          <ellipse cx="538" cy="40" rx="90" ry="25" fill="#fff0d5" stroke="#000" stroke-width="1.5" />
          <text x="540" y="43" text-anchor="middle" font-size="12" font-weight="bold">Anbar Khamir Ghadim</text>
          <text x="800" y="150" text-anchor="middle" font-size="11" font-weight="bold">Water Station</text>
          <text x="800" y="200" text-anchor="middle" font-size="11" font-weight="bold">Gas Station</text>
          
          <rect x="300" y="10" width="100" height="30" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="350" y="30" text-anchor="middle" font-size="11" font-weight="bold">Laboratory</text>
          
          <!-- Pallet B 12 cube -->
          <g transform="translate(735, 15)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="24" text-anchor="middle" font-size="7" font-weight="bold">Pallet</text>
            <text x="25" y="32" text-anchor="middle" font-size="7" font-weight="bold">B</text>
            <text x="25" y="40" text-anchor="middle" font-size="7" font-weight="bold">12</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
          
          <!-- Pallet C 17 cube -->
          <g transform="translate(790, 15)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="24" text-anchor="middle" font-size="7" font-weight="bold">Pallet</text>
            <text x="25" y="32" text-anchor="middle" font-size="7" font-weight="bold">C</text>
            <text x="25" y="40" text-anchor="middle" font-size="7" font-weight="bold">17</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>

          <!-- Reels in Anbar Khamir Ghadim -->
          <ellipse cx="750" cy="100" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 740,100 L 740,70 L 760,70 L 760,100" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="750" cy="70" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="775" cy="100" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 765,100 L 765,70 L 785,70 L 785,100" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="775" cy="70" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="800" cy="100" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 790,100 L 790,70 L 810,70 L 810,100" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="800" cy="70" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />

          <ellipse cx="825" cy="100" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 815,100 L 815,70 L 835,70 L 835,100" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="825" cy="70" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />

          <ellipse cx="850" cy="100" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 840,100 L 840,70 L 860,70 L 860,100" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="850" cy="70" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />

        </g>

        <!-- Weight Station 1 -->
        <g class="weight-station-1">
          <rect x="320" y="490" width="60" height="150" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="350" y="565" text-anchor="middle" font-size="11" font-weight="bold">Weight</text>
          <text x="350" y="585" text-anchor="middle" font-size="11" font-weight="bold">Station</text>
          <text x="350" y="605" text-anchor="middle" font-size="11" font-weight="bold">1</text>
        </g>

        <!-- Anbar Sangin -->
        <g class="anbar-sangin">
          <rect x="710" y="345" width="190" height="75" fill="none" stroke="#000" stroke-width="2" />
          <rect x="710" y="420" width="190" height="170" fill="none" stroke="#000" stroke-width="2" />
          <text x="800" y="380" text-anchor="middle" font-size="12" font-weight="bold">Anbar Abzar</text>
          <text x="800" y="580" text-anchor="middle" font-size="12" font-weight="bold">Anbar Sangin</text>
          
          <!-- Pile of 5 Chemical Sacks (3:5:2 ratio = 30:50:20 pixels) -->
          <g class="chemical-sacks" transform="translate(720, 440)">
            <!-- Bottom Row - 3 Sacks -->
            <!-- Sack 1 (bottom left) -->
            <g transform="translate(33, 50)">
              <rect x="0" y="0" width="20" height="30" rx="3" fill="#8B4513" stroke="#5D2906" stroke-width="1.5"/>
              <path d="M 0,0 L 10,-10 L 25,-10 L 20,0 Z" fill="#A0522D" stroke="#5D2906" stroke-width="1"/>
              <path d="M 20,0 L 25,-10 L 25,25 L 20,30 Z" fill="#6B3A0F" stroke="#5D2906" stroke-width="1"/>
              <text x="15" y="28" text-anchor="middle" font-size="6" fill="#fff" font-weight="bold">CHEM</text>
            </g>
            
            <!-- Sack 2 (bottom center) -->
            <g transform="translate(58, 50)">
              <rect x="0" y="0" width="20" height="30" rx="3" fill="#8B4513" stroke="#5D2906" stroke-width="1.5"/>
              <path d="M 0,0 L 10,-10 L 25,-10 L 20,0 Z" fill="#A0522D" stroke="#5D2906" stroke-width="1"/>
              <path d="M 20,0 L 25,-10 L 25,25 L 20,30 Z" fill="#6B3A0F" stroke="#5D2906" stroke-width="1"/>
              <text x="15" y="28" text-anchor="middle" font-size="6" fill="#fff" font-weight="bold">CHEM</text>
            </g>
            
            <!-- Sack 3 (bottom right) -->
            <g transform="translate(83, 50)">
              <rect x="0" y="0" width="20" height="30" rx="3" fill="#8B4513" stroke="#5D2906" stroke-width="1.5"/>
              <path d="M 0,0 L 10,-10 L 25,-10 L 20,0 Z" fill="#A0522D" stroke="#5D2906" stroke-width="1"/>
              <path d="M 20,0 L 25,-10 L 25,25 L 20,30 Z" fill="#6B3A0F" stroke="#5D2906" stroke-width="1"/>
              <text x="15" y="28" text-anchor="middle" font-size="6" fill="#fff" font-weight="bold">CHEM</text>
            </g>
            
            <!-- Top Row - 2 Sacks (stacked on bottom row) -->
            <!-- Sack 4 (top left) -->
            <g transform="translate(50, 20)">
              <rect x="0" y="0" width="20" height="30" rx="3" fill="#A0522D" stroke="#5D2906" stroke-width="1.5"/>
              <path d="M 0,0 L 10,-10 L 25,-10 L 20,0 Z" fill="#CD853F" stroke="#5D2906" stroke-width="1"/>
              <path d="M 20,0 L 25,-10 L 25,25 L 20,30 Z" fill="#8B4513" stroke="#5D2906" stroke-width="1"/>
              <text x="15" y="28" text-anchor="middle" font-size="6" fill="#fff" font-weight="bold">CHEM</text>
            </g>
            
            <!-- Sack 5 (top right) -->
            <g transform="translate(70, 20)">
              <rect x="0" y="0" width="20" height="30" rx="3" fill="#A0522D" stroke="#5D2906" stroke-width="1.5"/>
              <path d="M 0,0 L 10,-10 L 25,-10 L 20,0 Z" fill="#CD853F" stroke="#5D2906" stroke-width="1"/>
              <path d="M 20,0 L 25,-10 L 25,25 L 20,30 Z" fill="#8B4513" stroke="#5D2906" stroke-width="1"/>
              <text x="15" y="28" text-anchor="middle" font-size="6" fill="#fff" font-weight="bold">CHEM</text>
            </g>
          </g>

          <!-- Reels in Anbar Khamir Ghadim -->
          <ellipse cx="750" cy="560" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 740,560 L 740,530 L 760,530 L 760,560" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="750" cy="530" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="775" cy="560" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 765,560 L 765,530 L 785,530 L 785,560" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="775" cy="530" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="800" cy="560" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 790,560 L 790,530 L 810,530 L 810,560" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="800" cy="530" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />

          <ellipse cx="825" cy="560" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 815,560 L 815,530 L 835,530 L 835,560" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="825" cy="530" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />

          <ellipse cx="850" cy="560" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <path d="M 840,560 L 840,530 L 860,530 L 860,560" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
          <ellipse cx="850" cy="530" rx="10" ry="4" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
        </g>

        <!-- QC Area (moved left with gap from right narrow green oval) -->
        <g class="qc-area">
          <rect x="710" y="590" width="190" height="130" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="800" y="660" text-anchor="middle" font-size="13" font-weight="bold">QC</text>
        </g>

        <!-- Narrow Green Ovals (Roads) - Narrower, half height from top -->
        <g class="roads">
          <!-- First vertical divider (left, narrower, moved down a bit) -->
          <ellipse cx="480" cy="520" rx="10" ry="175" fill="#c8e6c9" stroke="#4caf50" stroke-width="2" />
          <!-- Second vertical divider (right-center, narrower, moved down a bit) -->
          <ellipse cx="950" cy="520" rx="10" ry="175" fill="#c8e6c9" stroke="#4caf50" stroke-width="2" />
          <!-- Third divider (right upper, height increased by 1/3: 87.5 * 1.333 = 116.7, extended from bottom) -->
          <ellipse cx="950" cy="117.5" rx="10" ry="106.7" fill="#c8e6c9" stroke="#4caf50" stroke-width="2" />
        </g>
        
        <!-- Workflow Path (CLEAN - NO ARROWS - AVOIDING ALL BUILDINGS) -->
        <g class="workflow-path">
          <!-- GREEN Path (Incoming): Entrance → W1 → Above/Below left tree → Warehouses → W2 → Exit -->
          <g stroke="#4caf50" stroke-width="4" stroke-dasharray="12,8" opacity="0.5" fill="none" class="path-animation">
            <!-- From entrance up to Weight Station 1 -->
            <line x1="350" y1="760" x2="350" y2="260" />
            
            <!-- Turn right ABOVE left tree (20px gap from top at y=345) -->
            <line x1="350" y1="260" x2="650" y2="260" />
                       
            <!-- Path to Anbar Sangin -->
            <line x1="650" y1="260" x2="650" y2="715" />
            
            <!-- Turn right BELOW left tree (20px gap from bottom at y=695) -->
            <line x1="650" y1="715" x2="350" y2="715" />
            
            <!-- Turn right to avoid tree and return to main path -->
            <line x1="350" y1="715" x2="350" y2="760" />
            
            <!-- Alternative path to W2 (from warehouses area) -->
            <line x1="650" y1="260" x2="1050" y2="260" />
            <line x1="1050" y1="260" x2="1050" y2="410" />
            <line x1="1050" y1="410" x2="1140" y2="410" />
            
            <!-- From W2 to Exit -->
            <line x1="1140" y1="410" x2="1050" y2="410" />
            <line x1="1050" y1="410" x2="1050" y2="724" />
            <line x1="1050" y1="724" x2="1050" y2="760" />

            <!-- From Exit to Street -->
            <line x1="1050" y1="760" x2="1050" y2="820" />
            <line x1="1050" y1="820" x2="0" y2="820" />
          </g>
          
          <!-- BLUE Path (Outgoing): Entrance → W1 → Straight down beside Salon Tolid → Right to W2 → Exit -->
          <g stroke="#04467c" stroke-width="4" stroke-dasharray="12,8" opacity="0.5" fill="none" class="path-animation">
            <!-- From entrance up to Weight Station 1 -->
            <line x1="350" y1="760" x2="350" y2="670" />
            <line x1="350" y1="670" x2="350" y2="580" />
            
            <!-- Continue STRAIGHT DOWN vertically from W1 to beside Anbar Salon Tolid -->
            <line x1="350" y1="580" x2="350" y2="465" />
            
            <!-- Move left to beside Anbar Salon Tolid (outside the building) -->
            <line x1="350" y1="465" x2="280" y2="465" />
            
            <!-- Down beside the building -->
            <line x1="280" y1="465" x2="280" y2="280" />

            <!-- Horizontal path to W2 area (across the top, avoiding buildings) -->
            <line x1="280" y1="280" x2="1110" y2="280" />
            
            <!-- Down to W2 -->
            <line x1="1110" y1="280" x2="1110" y2="410" />
            
            <!-- From W2 to Exit -->
            <line x1="1110" y1="410" x2="1070" y2="410" />
            <line x1="1070" y1="410" x2="1070" y2="724" />
            <line x1="1070" y1="724" x2="1070" y2="760" />

            <!-- From Exit to Street -->
            <line x1="1070" y1="760" x2="1070" y2="820" />
            <line x1="1070" y1="820" x2="100" y2="820" />
          </g>
          
          <!-- ANBAR PAK & AKHAL External Unload Path (OUTSIDE FACTORY) -->
          <g stroke="#ff0000" stroke-width="4" stroke-dasharray="8,6" opacity="0.5" fill="none">
            <!-- Exit factory to street -->
            <line x1="1050" y1="760" x2="1050" y2="820" />
            
            <!-- Along street to Anbar PAK/Akhal area -->
            <line x1="1050" y1="820" x2="1400" y2="820" />
            
            <!-- Up to Anbar PAK (outside) -->
            <line x1="1400" y1="820" x2="1400" y2="650" />
          </g>
        </g>

        <!-- Anbar Mohavate Kordan (Akhal) -->
        <g transform="translate(975,10)">
          <!-- Front face (height doubled) -->
          <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
          <text x="25" y="24" text-anchor="middle" font-size="7" font-weight="bold">Pallet</text>
          <text x="25" y="32" text-anchor="middle" font-size="7" font-weight="bold">B</text>
          <text x="25" y="40" text-anchor="middle" font-size="7" font-weight="bold">12</text>
          <!-- Top face -->
          <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
          <!-- Right side face -->
          <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
        </g>
        <g transform="translate(975,50)">
          <!-- Front face (height doubled) -->
          <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
          <text x="25" y="24" text-anchor="middle" font-size="7" font-weight="bold">Pallet</text>
          <text x="25" y="32" text-anchor="middle" font-size="7" font-weight="bold">B</text>
          <text x="25" y="40" text-anchor="middle" font-size="7" font-weight="bold">12</text>
          <!-- Top face -->
          <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
          <!-- Right side face -->
          <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
        </g>

        <!-- Anbar Khamir Kordan-->
        <g class="right-container">
          <rect x="1170" y="70" width="210" height="220" fill="none" stroke="#000" stroke-width="2" />
          <path d="M 1170,290 L 1170,660 L 1380,660 L 1380,290" fill="none" stroke="#000" stroke-width="1.5" />

          <!-- Oval inside Anbar Khamir Kordan -->
          <ellipse cx="1280" cy="125" rx="90" ry="40" fill="#fff0d5" stroke="#000" stroke-width="2" />
          <text x="1280" y="115" text-anchor="middle" font-size="12" font-weight="bold">Anbar</text>
          <text x="1280" y="130" text-anchor="middle" font-size="12" font-weight="bold">Khamir</text>
          <text x="1280" y="145" text-anchor="middle" font-size="12" font-weight="bold">KORDAN</text>
          
          <!-- Akhal 1 100 cube (height doubled: 20→40) -->g>
          <g transform="translate(1200, 200)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="24" text-anchor="middle" font-size="7" font-weight="bold">Pallet</text>
            <text x="25" y="32" text-anchor="middle" font-size="7" font-weight="bold">B</text>
            <text x="25" y="40" text-anchor="middle" font-size="7" font-weight="bold">12</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
          <g transform="translate(1255, 200)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="24" text-anchor="middle" font-size="7" font-weight="bold">Pallet</text>
            <text x="25" y="32" text-anchor="middle" font-size="7" font-weight="bold">B</text>
            <text x="25" y="40" text-anchor="middle" font-size="7" font-weight="bold">12</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
          <g transform="translate(1310, 200)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="24" text-anchor="middle" font-size="7" font-weight="bold">Pallet</text>
            <text x="25" y="32" text-anchor="middle" font-size="7" font-weight="bold">B</text>
            <text x="25" y="40" text-anchor="middle" font-size="7" font-weight="bold">12</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
          <g transform="translate(1200, 240)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="24" text-anchor="middle" font-size="7" font-weight="bold">Pallet</text>
            <text x="25" y="32" text-anchor="middle" font-size="7" font-weight="bold">B</text>
            <text x="25" y="40" text-anchor="middle" font-size="7" font-weight="bold">12</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
          <g transform="translate(1255, 240)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="24" text-anchor="middle" font-size="7" font-weight="bold">Pallet</text>
            <text x="25" y="32" text-anchor="middle" font-size="7" font-weight="bold">B</text>
            <text x="25" y="40" text-anchor="middle" font-size="7" font-weight="bold">12</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
          <g transform="translate(1310, 240)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="24" text-anchor="middle" font-size="7" font-weight="bold">Pallet</text>
            <text x="25" y="32" text-anchor="middle" font-size="7" font-weight="bold">B</text>
            <text x="25" y="40" text-anchor="middle" font-size="7" font-weight="bold">12</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>

          <!-- PM4 Area  -->
          <rect x="1290" y="320" width="55" height="300" fill="#f5f5f5" stroke="#000" stroke-width="2" />
          <!-- Top empty square -->
          <rect x="1295" y="325" width="45" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <!-- Bottom empty square -->
          <rect x="1295" y="570" width="45" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="1322" y="470" text-anchor="middle" font-size="12" font-weight="bold">PM4</text>
        </g>

        <!-- Office (increased 20%: 108×108, moved up with gap below Kordan) -->
        <g class="office">
          <rect x="1170" y="670" width="108" height="108" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="1224" y="729" text-anchor="middle" font-size="12" font-weight="bold">Office</text>
        </g>

        <!-- Weight Station 2 (narrower, taller, moved down, stick to Kordan at x=1170) -->
        <g class="weight-station-2">
          <rect x="1110" y="320" width="60" height="150" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="1140" y="395" text-anchor="middle" font-size="11" font-weight="bold">Weight</text>
          <text x="1140" y="415" text-anchor="middle" font-size="11" font-weight="bold">Station</text>
          <text x="1140" y="435" text-anchor="middle" font-size="11" font-weight="bold">2</text>
        </g>

        <!-- Anbar PAK -->
        <g class="anbar-pak">
          <rect x="1380" y="460" width="60" height="323" fill="none" stroke="#000" stroke-width="2" />
          <text x="1410" y="620" text-anchor="middle" font-size="12" font-weight="bold" transform="rotate(90 1410 620)">Anbar PAK</text>
          
          <!-- Akhal 4 98 cube (height doubled: 16→32) -->
          <g transform="translate(1375, 480)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="31" text-anchor="middle" font-size="8" font-weight="bold">Akhal 4 98</text>
            <!-- Top face (parallelogram) -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face (height doubled) -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
        </g>

        <!-- Entrances (repositioned) -->
        <g class="entrances">
          <!-- Left entrance - under Weight Station 1 -->
          <rect x="290" y="760" width="120" height="42" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="340" y="785" text-anchor="middle" font-size="12">Entrance</text>
          
          <!-- Right entrance - moved to right -->
          <rect x="1010" y="760" width="120" height="42" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="1070" y="785" text-anchor="middle" font-size="12">Entrance</text>
        </g>

        <!-- STATIC FORKLIFTS (Always Visible - Ready State - BIGGER) -->
        <g class="static-forklifts">
          <!-- Forklift 1 - Near Mohavate Homayoun -->
          <g transform="translate(600, 105)">
            <text x="0" y="0" font-size="30" text-anchor="middle">🚜</text>
            <circle cx="-12" cy="-13" r="5" fill="#4caf50" stroke="#fff" stroke-width="2" />
            <text x="0" y="20" text-anchor="middle" font-size="8" fill="#4caf50" font-weight="bold">READY</text>
          </g>
          
          <!-- Forklift 2 - Near Anbar Sangin -->
          <!-- <g transform="translate(685, 550)">
            <text x="0" y="0" font-size="30" text-anchor="middle">🚜</text>
            <circle cx="-12" cy="-13" r="5" fill="#4caf50" stroke="#fff" stroke-width="2" />
            <text x="0" y="20" text-anchor="middle" font-size="8" fill="#4caf50" font-weight="bold">READY</text>
          </g> -->
          
          <!-- Forklift 3 - Near Mohavate Kordan -->
          <g transform="translate(1080, 35)">
            <text x="0" y="0" font-size="30" text-anchor="middle">🚜</text>
            <circle cx="-12" cy="-13" r="5" fill="#4caf50" stroke="#fff" stroke-width="2" />
            <text x="0" y="20" text-anchor="middle" font-size="8" fill="#4caf50" font-weight="bold">READY</text>
          </g>
          
          <!-- Forklift 4 - Near Anbar Salon Tolid -->
          <g transform="translate(270, 255)">
            <text x="0" y="0" font-size="30" text-anchor="middle">🚜</text>
            <circle cx="-12" cy="-13" r="5" fill="#4caf50" stroke="#fff" stroke-width="2" />
            <text x="0" y="20" text-anchor="middle" font-size="8" fill="#4caf50" font-weight="bold">READY</text>
          </g>
        </g>

        <!-- Anbar Akhal -->
        <g class="anbar-akhal-bottom">
          <rect x="40" y="843" width="320" height="125" fill="none" stroke="#000" stroke-width="2" />
          <text x="200" y="860" text-anchor="middle" font-size="12" font-weight="bold">Anbar Akhal</text>
          
          <!-- Akhal 3 114 cube -->
          <g transform="translate(110, 890)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="31" text-anchor="middle" font-size="8" font-weight="bold">Akhal 3 114</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
          
          <!-- Akhal 4 260 cube -->
          <g transform="translate(165, 890)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="31" text-anchor="middle" font-size="8" font-weight="bold">Akhal 4 260</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
          
          <!-- Akhal 2 170 cube -->
          <g transform="translate(220, 890)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="31" text-anchor="middle" font-size="8" font-weight="bold">Akhal 2 170</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
        </g>

        <!-- Static truck icons removed - only dynamic trucks from database will show -->

        <!-- ============================================ -->
        <!-- DYNAMIC DATA FROM DATABASE -->  
        <!-- ============================================ -->

        <!-- Warehouse Inventory Badges (Dynamic - Two Circles: Products Weight & Raw Materials Weight) -->
        <g class="warehouse-badges">
          <g 
            v-for="warehouse in warehouseNames" 
            :key="warehouse"
            :transform="`translate(${warehouseBadgePositions[warehouse].x}, ${warehouseBadgePositions[warehouse].y})`"
          >
          <!-- PRODUCTS Weight Circle (Top) - Green - CLICKABLE -->
          <g class="clickable-circle" @click="openProductsDialog(warehouse)">
            <circle cx="0" cy="0" r="20" fill="#4CAF50" stroke="#fff" stroke-width="2.5" opacity="0.95" />
            <text 
              x="0" 
              y="-3" 
              text-anchor="middle" 
              font-size="10" 
              font-weight="bold" 
              fill="#fff"
            >
              {{ formatWeight(getWarehouseProductsWeight(warehouse)) }}
            </text>
            <text 
              x="0" 
              y="8" 
              text-anchor="middle" 
              font-size="7" 
              fill="#fff"
              opacity="0.9"
            >
              Products
            </text>
          </g>

          <!-- RAW MATERIALS Weight Circle (Bottom) - Orange - CLICKABLE -->
          <g class="clickable-circle" @click="openRawMaterialsDialog(warehouse)">
            <circle cx="40" cy="0" r="20" fill="#FF9800" stroke="#fff" stroke-width="2.5" opacity="0.95" />
            <text 
              x="40" 
              y="-3" 
              text-anchor="middle" 
              font-size="10" 
              font-weight="bold" 
              fill="#fff"
            >
              {{ formatWeight(getWarehouseRawMaterialsWeight(warehouse)) }}
            </text>
            <text 
              x="40" 
              y="8" 
              text-anchor="middle" 
              font-size="7" 
              fill="#fff"
              opacity="0.9"
            >
              Raw Mat.
            </text>
          </g>
            
            <!-- Warehouse name tooltip on hover -->
            <title>{{ formatWarehouseName(warehouse) }}
              Products: {{ (getWarehouseProductsWeight(warehouse) || 0).toFixed(2) }} ton
              Raw Materials: {{ (getWarehouseRawMaterialsWeight(warehouse) || 0).toFixed(2) }} ton
              Total: {{ (getWarehouseWeight(warehouse) || 0).toFixed(2) }} ton</title>
          </g>
        </g>

        <!-- Active Trucks (Dynamic - Workflow Animation - REALISTIC SHAPE WITH ROTATION) -->
        <g class="active-trucks">
          <g 
            v-for="(shipment, index) in activeShipments.filter(s => !truckAnimations[s.id]?.exited)" 
            :key="shipment.id"
            :style="{ 
              transform: `translate(${getAnimatedTruckPosition(shipment).x}px, ${getAnimatedTruckPosition(shipment).y}px)`,
              // transform: `translate(${getTruckPosition(shipment).x}px, ${getTruckPosition(shipment).y}px)`,
              // transition: 'transform 3s ease-in-out' // #######################################################################
            }"
            class="truck-animated"
          >
            <!-- Professional 3D Flatbed Truck (REVERSED - Cab at back, trailer at front) -->
            <g :transform="`translate(${-90 - (index % 3) * 20}, ${-70 - Math.floor(index / 3) * 70}) rotate(${getAnimatedTruckRotation(shipment)} 90 70) scale(${(isTruckMovingLeft(shipment) ? -1 : 1) * 0.7}, 0.7)`">  

              <!-- Motion trail effect (if truck is moving) - now at back -->
              <g v-if="shipment.status === 'Registered' || shipment.status === 'LoadedUnloaded'" class="motion-trail" opacity="0.4">
                <ellipse cx="135" cy="95" rx="30" ry="8" :fill="shipment.shipment_type === 'Incoming' ? '#4caf50' : '#2196f3'" class="trail-pulse" />
                <ellipse cx="155" cy="95" rx="20" ry="6" :fill="shipment.shipment_type === 'Incoming' ? '#4caf50' : '#2196f3'" class="trail-pulse" style="animation-delay: 0.2s" />
                <ellipse cx="170" cy="95" rx="15" ry="4" :fill="shipment.shipment_type === 'Incoming' ? '#4caf50' : '#2196f3'" class="trail-pulse" style="animation-delay: 0.4s" />
              </g>
              
              <!-- Shadow (3D effect) -->
              <ellipse cx="90" cy="93" rx="80" ry="10" fill="#00000030" />
              
              <!-- =============== FLATBED TRAILER (3D PERSPECTIVE) - NOW AT FRONT =============== -->
              
              <!-- Trailer platform - bottom face -->
              <rect 
                x="5" 
                y="45" 
                width="105" 
                height="35" 
                :fill="shipment.shipment_type === 'Incoming' ? '#e8e8e8' : '#f0f0f0'" 
                stroke="#333" 
                stroke-width="2"
                rx="2"
              />
              
              <!--  //Trailer platform - top face (3D perspective)
              <path 
                d="M 5,45 L -3,38 L 102,38 L 110,45 Z" 
                :fill="shipment.shipment_type === 'Incoming' ? '#f5f5f5' : '#ffffff'" 
                stroke="#333" 
                stroke-width="2"
              /> -->
              
              <!-- Trailer platform - left side face (3D depth) -->
              <path 
                d="M 5,45 L -3,38 L -3,73 L 5,80 Z" 
                :fill="shipment.shipment_type === 'Incoming' ? '#d0d0d0' : '#dadada'" 
                stroke="#333" 
                stroke-width="2"
              />
              
              <!-- Platform stripes (flatbed details) -->
              <line x1="10" y1="38" x2="10" y2="80" stroke="#999" stroke-width="1.5" opacity="0.5" />
              <line x1="30" y1="38" x2="30" y2="80" stroke="#999" stroke-width="1.5" opacity="0.5" />
              <line x1="50" y1="38" x2="50" y2="80" stroke="#999" stroke-width="1.5" opacity="0.5" />
              <line x1="70" y1="38" x2="70" y2="80" stroke="#999" stroke-width="1.5" opacity="0.5" />
              <line x1="90" y1="38" x2="90" y2="80" stroke="#999" stroke-width="1.5" opacity="0.5" />
              
              <!-- Side rails (safety barriers) -->
              <rect x="5" y="43" width="105" height="3" :fill="shipment.shipment_type === 'Incoming' ? '#4caf50' : '#2196f3'" stroke="#222" stroke-width="1" />
              <rect x="5" y="80" width="105" height="3" :fill="shipment.shipment_type === 'Incoming' ? '#4caf50' : '#2196f3'" stroke="#222" stroke-width="1" />
              
              <!-- =============== CARGO/PACKAGE (Only for Incoming shipments) =============== "shipment.shipment_type === 'Incoming'"-->
              <g v-if="truckHasCargo(shipment)"
                 class="cargo-clickable"
                 @click="openCargoDialog(shipment)"
                 style="cursor: pointer;">
                <!-- 3D Cube/Package on trailer -->
                <g transform="translate(25, 30)">
                  <!-- Cube Front Face -->
                  <rect 
                    x="0" 
                    y="0" 
                    width="60" 
                    height="50" 
                    fill="#D2691E" 
                    stroke="#8B4513" 
                    stroke-width="3"
                  />
                  
                  <!-- Cube Top Face (3D perspective) -->
                  <path 
                    d="M 60,0 L 68,-6 L 68,-6 L 60,0 Z" 
                    fill="#F4A460" 
                    stroke="#8B4513" 
                    stroke-width="3"
                  />
                  
                  <!-- Cube Right Side Face (3D depth) -->
                  <path 
                    d="M 60,0 L 68,-6 L 68,44 L 60,50 Z" 
                    fill="#A0522D" 
                    stroke="#8B4513" 
                    stroke-width="2.5"
                  />
                  
                  <!-- Packaging tape/straps (horizontal) -->
                  <rect x="3" y="12" width="54" height="3" fill="#FFD700" stroke="#DAA520" stroke-width="1" />
                  <rect x="3" y="35" width="54" height="3" fill="#FFD700" stroke="#DAA520" stroke-width="1" />
                  
                  <!-- Packaging tape (vertical) -->
                  <rect x="28" y="2" width="3" height="46" fill="#FFD700" stroke="#DAA520" stroke-width="1" />
                                    
                  <!-- Material Type Label (top section - white background) -->
                  <rect 
                    x="8" 
                    y="4" 
                    width="44" 
                    height="9" 
                    fill="#FFFFFF" 
                    stroke="#333" 
                    stroke-width="1.5"
                    rx="1"
                  />
                  
                  <!-- Material Type Text (smaller, at top) -->
                  <text 
                    x="30" 
                    y="10" 
                    text-anchor="middle" 
                    font-size="6" 
                    font-weight="bold" 
                    fill="#1a1a1a"
                    font-family="Arial, sans-serif"
                  >
                    {{ shipment.material_type || 'TYPE' }}
                  </text>

                  <!-- Material Name Label (white background) -->
                  <rect 
                    x="8" 
                    y="18" 
                    width="44" 
                    height="12" 
                    fill="#FFFFFF" 
                    stroke="#333" 
                    stroke-width="1.5"
                    rx="1"
                  />
                  
                  <!-- Material Name Text -->
                  <text 
                    x="30" 
                    y="26" 
                    text-anchor="middle" 
                    font-size="7" 
                    font-weight="bold" 
                    fill="#000"
                    font-family="Arial, sans-serif"
                  >
                    {{ shipment.material_name || 'Material' }}
                  </text>

                  <!-- Fragile/Handle with Care symbol (small, corner) -->
                  <g transform="translate(2, 19)">
                    <path 
                      d="M 4,0 L 0,5 L 8,5 Z" 
                      fill="none" 
                      stroke="#FF0000" 
                      stroke-width="1.5"
                    />
                    <circle cx="4" cy="7" r="0.8" fill="#FF0000" />    
                    <text x="4" y="11" text-anchor="middle" font-size="3" fill="#FF0000" font-weight="bold">!</text>                    
                  </g>

                      
                  <!-- Directional arrows (This Side Up) -->
                  <g transform="translate(50, 42)">
                    <path d="M 0,0 L 3,-3 L 6,0" fill="none" stroke="#000" stroke-width="1" />
                    <line x1="3" y1="-3" x2="3" y2="2" stroke="#000" stroke-width="1" />
                  </g>
                </g>
              </g>

              <!-- Front bumper/light bar -->
              <rect x="5" y="48" width="3" height="28" fill="#ff4444" stroke="#222" stroke-width="1" />
              
              <!-- Reflective tape (yellow/red stripes) -->
              <rect x="10" y="50" width="2" height="6" fill="#ffeb3b" />
              <rect x="10" y="58" width="2" height="6" fill="#ff3333" />
              <rect x="10" y="66" width="2" height="6" fill="#ffeb3b" />
              <rect x="10" y="74" width="2" height="6" fill="#ff3333" />
              
              <!-- =============== TRACTOR/CAB (3D) - NOW AT BACK =============== -->
              
              <!-- Cab body - front face -->
              <path 
                d="M 172,48 L 172,75 L 168,82 L 115,82 L 112,75 L 112,42 L 118,38 L 165,38 Z" 
                :fill="shipment.shipment_type === 'Incoming' ? '#66bb6a' : '#64b5f6'" 
                stroke="#1a1a1a" 
                stroke-width="2.5"
              />
              
              <!-- Cab - top face (3D roof) -->
              <path 
                d="M 172,48 L 165,42 L 112,42 L 112,42 Z" 
                :fill="shipment.shipment_type === 'Incoming' ? '#81c784' : '#90caf9'" 
                stroke="#1a1a1a" 
                stroke-width="2"
              />
              
              <!-- Windshield (large, angled) -->
              <path 
                d="M 168,40 L 162,38 L 125,38 L 120,40 L 120,50 L 168,50 Z" 
                fill="#90caf9" 
                stroke="#1a1a1a" 
                stroke-width="2"
                opacity="0.85"
              />
              
              <!-- Windshield glare effect -->
              <path 
                d="M 165,40 L 160,39 L 145,39 L 145,42 L 165,42 Z" 
                fill="#ffffff" 
                opacity="0.4"
              />
              
              <!-- Side window -->
              <rect x="148" y="55" width="20" height="18" fill="#90caf9" stroke="#1a1a1a" stroke-width="1.5" opacity="0.85" />
              
              <!-- Door line -->
              <line x1="145" y1="75" x2="145" y2="82" stroke="#1a1a1a" stroke-width="2" />
              
              <!-- Rear grille (3D look) -->
              <rect x="168" y="60" width="6" height="15" fill="#263238" stroke="#1a1a1a" stroke-width="2" />
              <line x1="170" y1="62" x2="170" y2="73" stroke="#444" stroke-width="1.5" />
              <line x1="172" y1="62" x2="172" y2="73" stroke="#444" stroke-width="1.5" />
              
              <!-- Rear lights (3D) -->
              <ellipse cx="172" cy="72" rx="3" ry="4" fill="#ff3333" stroke="#1a1a1a" stroke-width="1" opacity="0.9" />
              <ellipse cx="172" cy="79" rx="3" ry="3" fill="#ff9800" stroke="#1a1a1a" stroke-width="1" />
              
              <!-- Side mirror -->
              <rect x="172" y="52" width="4" height="3" :fill="shipment.shipment_type === 'Incoming' ? '#558b2f' : '#1976d2'" stroke="#000" stroke-width="1" />
              <line x1="172" y1="53" x2="168" y2="58" stroke="#333" stroke-width="1.5" />
              
              <!-- =============== WHEELS (3D perspective) =============== -->
              
              <!-- Trailer wheels (front, triple axle like in image) -->
              <g>
                <!-- Front wheel set -->
                <circle cx="15" cy="85" r="10" fill="#2c3e50" stroke="#1a1a1a" stroke-width="2.5" />
                <circle cx="15" cy="85" r="6" fill="#546e7a" />
                <circle cx="15" cy="85" r="3" fill="#1a1a1a" />
                <circle cx="15" cy="85" r="1.5" fill="#666" />
                
                <!-- Middle wheel set -->
                <circle cx="35" cy="85" r="10" fill="#2c3e50" stroke="#1a1a1a" stroke-width="2.5" />
                <circle cx="35" cy="85" r="6" fill="#546e7a" />
                <circle cx="35" cy="85" r="3" fill="#1a1a1a" />
                <circle cx="35" cy="85" r="1.5" fill="#666" />
                
                <!-- Rear trailer wheel set -->
                <circle cx="55" cy="85" r="10" fill="#2c3e50" stroke="#1a1a1a" stroke-width="2.5" />
                <circle cx="55" cy="85" r="6" fill="#546e7a" />
                <circle cx="55" cy="85" r="3" fill="#1a1a1a" />
                <circle cx="55" cy="85" r="1.5" fill="#666" />
              </g>
              
              <!-- Cab wheels (rear steering) -->
              <g>
                <!-- Rear cab wheel -->
                <circle cx="160" cy="85" r="9" fill="#2c3e50" stroke="#1a1a1a" stroke-width="2.5" />
                <circle cx="160" cy="85" r="5" fill="#546e7a" />
                <circle cx="160" cy="85" r="2" fill="#1a1a1a" />
                
                <!-- Front cab wheel (drive axle) -->
                <circle cx="120" cy="85" r="10" fill="#2c3e50" stroke="#1a1a1a" stroke-width="2.5" />
                <circle cx="120" cy="85" r="6" fill="#546e7a" />
                <circle cx="120" cy="85" r="3" fill="#1a1a1a" />
                <circle cx="120" cy="85" r="1.5" fill="#666" />
              </g>
              
              <!-- Wheel hubs (metallic look) -->
              <circle cx="15" cy="85" r="2" fill="#c0c0c0" opacity="0.8" />
              <circle cx="35" cy="85" r="2" fill="#c0c0c0" opacity="0.8" />
              <circle cx="55" cy="85" r="2" fill="#c0c0c0" opacity="0.8" />
              <circle cx="120" cy="85" r="2" fill="#c0c0c0" opacity="0.8" />
              <circle cx="160" cy="85" r="1.5" fill="#c0c0c0" opacity="0.8" />
              
              <!-- =============== DETAILS =============== -->
              
              <!-- Exhaust stack (vertical pipe) -->
              <rect x="118" y="35" width="4" height="10" fill="#333" stroke="#000" stroke-width="1" rx="1" />
              <ellipse cx="120" cy="35" rx="2" ry="1.5" fill="#444" stroke="#000" stroke-width="1" />
              
              <!-- Air intake/filter -->
              <rect x="126" y="37" width="6" height="8" fill="#e0e0e0" stroke="#333" stroke-width="1" rx="1" />
              
              <!-- Status Indicator (large, prominent) -->
              <circle 
                cx="5" 
                cy="25" 
                r="12" 
                :fill="shipment.status === 'LoadingUnloading' ? '#ff5722' : (shipment.shipment_type === 'Incoming' ? '#4caf50' : '#2196f3')"
                stroke="#fff"
                stroke-width="3"
                :class="{ 'blink-animation': shipment.location === 'Weight_Station_1' || shipment.location === 'Weight_Station_2' || shipment.status === 'LoadingUnloading' && shipment.unload_location }"
              />
              
              <!-- License Plate (on trailer) -->
              <rect 
                x="30" 
                y="20" 
                width="50" 
                height="12" 
                fill="#ffffff" 
                stroke="#000" 
                stroke-width="2.5" 
                rx="2"
              />
              
              <text 
                x="55" 
                y="28" 
                text-anchor="middle" 
                font-size="9" 
                font-weight="bold" 
                fill="#000"
                font-family="Arial, sans-serif"
              >
                {{ shipment.license_number }}
              </text>
              
              <!-- Status text below truck -->
              <rect 
                x="35" 
                y="105" 
                width="110" 
                height="18" 
                :fill="shipment.status === 'Registered' ? '#ff9800' : shipment.status === 'LoadedUnloaded' ? '#ff9800' : shipment.status === 'LoadingUnloading' ? '#ff5722' : (shipment.shipment_type === 'Incoming' ? '#4caf50' : '#2196f3')" 
                stroke="#fff" 
                stroke-width="2" 
                rx="3"
                opacity="0.9"
                :class="{ 'blink-animation': shipment.status === 'Registered' || shipment.status === 'LoadedUnloaded' }"
              />
              
              <text 
                x="90" 
                y="117" 
                text-anchor="middle" 
                font-size="9" 
                font-weight="bold" 
                fill="#fff"
                font-family="Arial, sans-serif"
              >
                {{ shipment.status === 'Registered' ? '→ MOVING TO W1' : 
                  shipment.status === 'LoadedUnloaded' ? '→ MOVING TO W2' :
                  shipment.status === 'LoadingUnloading' ? 'LOADING...' :
                  shipment.status }}
              </text>
              
              <!-- Tooltip with full info -->
              <title>License: {{ shipment.license_number }}
Type: {{ shipment.shipment_type }}
Status: {{ shipment.status }}
Location: {{ shipment.location }}
{{ shipment.supplier_name ? 'Supplier: ' + shipment.supplier_name : '' }}
{{ shipment.customer_name ? 'Customer: ' + shipment.customer_name : '' }}
{{ shipment.unload_location ? 'Target: ' + shipment.unload_location : '' }}</title>
            </g>
          </g>
        </g>

        <!-- Active Forklifts (Dynamic - WORKING STATE - BIGGER) -->
        <g class="active-forklifts">
          <template v-for="(shipment, index) in activeShipments" :key="'forklift-' + shipment.id">
            <g v-if="shipment.status === 'LoadingUnloading' && shipment.unload_location">
              <!-- Position forklift near the truck (bigger offset for bigger truck) -->
              <g 
                :transform="`translate(${getTruckPosition(shipment).x + 80 + (index % 2) * 50}, ${getTruckPosition(shipment).y - 15})`"
                class="forklift-animated"
              >
                <!-- Forklift Emoji Icon (Bigger) -->
                <text 
                  x="0" 
                  y="0" 
                  font-size="35" 
                  text-anchor="middle"
                >🚜</text>
                
                <!-- Blinking WORKING indicator (Bigger) -->
                <circle cx="-20" cy="-22" r="8" fill="#ff5722" class="blink-animation" stroke="#fff" stroke-width="2.5" />
                
                <!-- Pallet/Box being moved (Bigger) -->
                <text 
                  x="25" 
                  y="6" 
                  font-size="25" 
                  text-anchor="middle"
                >📦</text>
                
                <!-- Status below (Bigger) -->
                <rect 
                  x="-30" 
                  y="18" 
                  width="60" 
                  height="16" 
                  fill="#ff9800" 
                  stroke="#fff" 
                  stroke-width="2" 
                  rx="3"
                />
                
                <text 
                  x="0" 
                  y="29" 
                  text-anchor="middle" 
                  font-size="10" 
                  font-weight="bold" 
                  fill="#fff"
                  font-family="Arial, sans-serif"
                >
                  WORKING
                </text>
                
                <!-- Tooltip -->
                <title>Forklift WORKING
Truck: {{ shipment.license_number }}
Type: {{ shipment.shipment_type }}
Location: {{ shipment.unload_location || 'Anbar_Salon_Tolid' }}</title>
              </g>
            </g>
          </template>
        </g>

        <!-- Data Info Display (COMPACT - RIGHT SIDE - ALIGNED WITH ANBAR AKHAL) -->
        <g class="data-info" v-if="!loading">
          <rect x="1280" y="843" width="300" height="125" fill="#6c79c5" opacity="0.95" rx="10" stroke="#fff" stroke-width="4" />
          
          <!-- Title with Icon -->
          <text x="1430" y="865" text-anchor="middle" font-size="13" font-weight="bold" fill="#fff">
            📊 STATUS
          </text>
          
          <!-- === Row 1: TRUCKS === -->
          <text x="1350" y="888" font-size="10" fill="#ffd54f" font-weight="bold">
            🚚 Trucks:
          </text>
          <text x="1380" y="888" text-anchor="end" font-size="14" fill="#fff" font-weight="bold">
            {{ activeShipments.length }}
          </text>
          
          <text x="1395" y="888" font-size="9" fill="#a5d6a7">
            In:
          </text>
          <text x="1450" y="888" text-anchor="end" font-size="11" fill="#fff" font-weight="bold">
            {{ incomingCount }}
          </text>
          
          <text x="1460" y="888" font-size="9" fill="#90caf9">
            Out:
          </text>
          <text x="1515" y="888" text-anchor="end" font-size="11" fill="#fff" font-weight="bold">
            {{ outgoingCount }}
          </text>
          
          <text x="1525" y="888" font-size="9" fill="#ffab91">
            Load:
          </text>
          <text x="1665" y="888" text-anchor="end" font-size="11" fill="#fff" font-weight="bold">
            {{ activeLoadingCount }}
          </text>
          
          <!-- === Row 2: MOVEMENTS === -->
          <text x="1295" y="910" font-size="9" fill="#fff9c4">
            → To W1:
          </text>
          <text x="1380" y="910" text-anchor="end" font-size="11" fill="#fff" font-weight="bold">
            {{ registeredCount }}
          </text>
          
          <text x="1395" y="910" font-size="9" fill="#f8bbd0">
            → To W2:
          </text>
          <text x="1515" y="910" text-anchor="end" font-size="11" fill="#fff" font-weight="bold">
            {{ loadedUnloadedCount }}
          </text>
          
          <!-- === Row 3: TOTAL STOCK === -->
          <text x="1350" y="935" font-size="11" fill="#b39ddb" font-weight="bold">
            📦 Stock:
          </text>
          <text x="1450" y="935" text-anchor="end" font-size="18" fill="#fff" font-weight="bold">
            {{ totalInventory }}
          </text>
        </g>
      </svg>
    </div>

    <!-- Inventory Details Dialog -->
    <div v-if="showInventoryDialog" class="inventory-dialog-overlay" @click.self="closeInventoryDialog">
      <div class="inventory-dialog">
        <!-- Dialog Header -->
        <div class="dialog-header" :class="{ 'header-green': dialogType === 'products', 'header-orange': dialogType !== 'products' }">
          <h2>
            <span v-if="dialogType === 'products'">📦 Products Inventory</span>
            <span v-else-if="dialogType === 'profiles'">📋 Profiles</span>
            <span v-else>🧱 Raw Materials</span>
          </h2>
          <h3>{{ formatWarehouseName(selectedWarehouse) }}</h3>
          <button class="close-btn" @click="closeInventoryDialog">✕</button>
        </div>
        
        <!-- Loading State -->
        <div v-if="loadingDetails" class="dialog-loading">
          <div class="spinner"></div>
          <p>Loading data...</p>
        </div>
        
        <!-- Dialog Content -->
        <div v-else-if="selectedWarehouseDetails" class="dialog-content">
          
          <!-- PRODUCTS VIEW (Green Circle) -->
          <template v-if="dialogType === 'products'">
            <!-- Summary Stats -->
            <div class="summary-stats">
              <div class="stat-box stat-green">
                <span class="stat-value">{{ selectedWarehouseDetails.data.summary?.total_reels || 0 }}</span>
                <span class="stat-label">Total Reels</span>
              </div>
              <div class="stat-box stat-blue">
                <span class="stat-value">{{ (selectedWarehouseDetails.data.summary?.total_products_weight_tons || 0).toFixed(2) }}t</span>
                <span class="stat-label">Total Weight</span>
              </div>
            </div>
            
            <!-- No Products Message -->
            <div v-if="!selectedWarehouseDetails.data.reels_by_width || selectedWarehouseDetails.data.reels_by_width.length === 0" class="no-data-section">
              <p>📦 No products found in this warehouse</p>
            </div>
            
            <!-- Cylinders Grid - Products by Width -->
            <div class="visualization-container" v-if="selectedWarehouseDetails.data.reels_by_width && selectedWarehouseDetails.data.reels_by_width.length > 0">
              <h4>Products by Width</h4>
              <div class="cylinders-grid">
                <div 
                  v-for="(item, index) in selectedWarehouseDetails.data.reels_by_width" 
                  :key="'width-' + index"
                  class="cylinder-item"
                >
                  <svg :height="getCylinderHeight(item.count, getMaxCount(selectedWarehouseDetails.data.reels_by_width)) + 50" width="80" class="cylinder-svg">
                    <!-- Cylinder top ellipse -->
                    <ellipse 
                      cx="40" 
                      cy="20" 
                      rx="30" 
                      ry="10" 
                      fill="#4CAF50" 
                      stroke="#2E7D32" 
                      stroke-width="2"
                    />
                    <!-- Cylinder body -->
                    <rect 
                      x="10" 
                      y="20" 
                      width="60" 
                      :height="getCylinderHeight(item.count, getMaxCount(selectedWarehouseDetails.data.reels_by_width))"
                      fill="#66BB6A" 
                      stroke="#2E7D32" 
                      stroke-width="2"
                    />
                    <!-- Cylinder bottom ellipse -->
                    <ellipse 
                      cx="40" 
                      :cy="20 + getCylinderHeight(item.count, getMaxCount(selectedWarehouseDetails.data.reels_by_width))" 
                      rx="30" 
                      ry="10" 
                      fill="#4CAF50" 
                      stroke="#2E7D32" 
                      stroke-width="2"
                    />
                    <!-- Count text on cylinder -->
                    <text 
                      x="40" 
                      :y="20 + getCylinderHeight(item.count, getMaxCount(selectedWarehouseDetails.data.reels_by_width)) / 2 - 5"
                      text-anchor="middle" 
                      fill="#fff" 
                      font-size="14" 
                      font-weight="bold"
                    >
                      {{ item.count }}
                    </text>
                    <!-- Weight text on cylinder -->
                    <text 
                      x="40" 
                      :y="20 + getCylinderHeight(item.count, getMaxCount(selectedWarehouseDetails.data.reels_by_width)) / 2 + 12"
                      text-anchor="middle" 
                      fill="#fff" 
                      font-size="10"
                    >
                      {{ item.total_weight_tons }}t
                    </text>
                  </svg>
                  <div class="cylinder-label">
                    <span class="width-value">{{ item.width }}mm</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
          
          <!-- RAW MATERIALS VIEW (Orange Circle) -->
          <template v-else-if="dialogType === 'rawMaterials'">
            <!-- Summary Stats -->
            <div class="summary-stats">
              <div class="stat-box stat-orange">
                <span class="stat-value">{{ selectedWarehouseDetails.data.summary?.total_raw_materials || 0 }}</span>
                <span class="stat-label">Total Raw Materials</span>
              </div>
              <div class="stat-box stat-blue">
                <span class="stat-value">{{ (selectedWarehouseDetails.data.summary?.total_raw_materials_weight_tons || 0).toFixed(2) }}t</span>
                <span class="stat-label">Total Weight</span>
              </div>
            </div>
            
            <!-- No Raw Materials Message -->
            <div v-if="!selectedWarehouseDetails.data.raw_materials_by_name || selectedWarehouseDetails.data.raw_materials_by_name.length === 0" class="no-data-section">
              <p>🧱 No raw materials found in this warehouse</p>
            </div>
            
            <!-- Cubes Grid - Raw Materials by Name -->
            <div class="visualization-container" v-if="selectedWarehouseDetails.data.raw_materials_by_name && selectedWarehouseDetails.data.raw_materials_by_name.length > 0">
              <h4>Raw Materials</h4>
              <div class="cubes-grid">
                <div 
                  v-for="(item, index) in selectedWarehouseDetails.data.raw_materials_by_name" 
                  :key="'material-' + index"
                  class="cube-item"
                >
                  <svg :width="getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name)) + 20" :height="getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name)) + 30" class="cube-svg">
                    <g :transform="`translate(10, 10)`">
                      <!-- Cube - Front face -->
                      <rect 
                        x="0" 
                        :y="15" 
                        :width="getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name)) - 15"
                        :height="getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name)) - 15"
                        fill="#FF9800" 
                        stroke="#E65100" 
                        stroke-width="2"
                      />
                      <!-- Cube - Top face -->
                      <path 
                        :d="`M 0,15 L 15,0 L ${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name))},0 L ${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name)) - 15},15 Z`"
                        fill="#FFB74D" 
                        stroke="#E65100" 
                        stroke-width="2"
                      />
                      <!-- Cube - Right face -->
                      <path 
                        :d="`M ${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name)) - 15},15 L ${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name))},0 L ${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name))},${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name)) - 15} L ${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name)) - 15},${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name))} Z`"
                        fill="#F57C00" 
                        stroke="#E65100" 
                        stroke-width="2"
                      />
                      <!-- Count text -->
                      <text 
                        :x="(getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name)) - 15) / 2"
                        :y="15 + (getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name)) - 15) / 2 - 5"
                        text-anchor="middle" 
                        fill="#fff" 
                        font-size="16" 
                        font-weight="bold"
                      >
                        {{ item.count }}
                      </text>
                      <!-- Weight text -->
                      <text 
                        :x="(getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name)) - 15) / 2"
                        :y="15 + (getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.raw_materials_by_name)) - 15) / 2 + 12"
                        text-anchor="middle" 
                        fill="#fff" 
                        font-size="11"
                      >
                        {{ item.total_weight_tons }}t
                      </text>
                    </g>
                  </svg>
                  <div class="cube-label">
                    <span class="material-name">{{ item.material_name || 'Unknown' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
          
          <!-- PROFILES VIEW (Orange Circle for Anbar_Salon_Tolid) -->
          <template v-else-if="dialogType === 'profiles'">
            <!-- Summary Stats -->
            <div class="summary-stats">
              <div class="stat-box stat-purple">
                <span class="stat-value">{{ selectedWarehouseDetails.data.summary?.total_profiles || 0 }}</span>
                <span class="stat-label">Total Profiles</span>
              </div>
            </div>
            
            <!-- No Profiles Message -->
            <div v-if="!selectedWarehouseDetails.data.profiles || selectedWarehouseDetails.data.profiles.length === 0" class="no-data-section">
              <p>📋 No profiles found in this warehouse</p>
            </div>
            
            <!-- Cubes Grid - Profiles -->
            <div class="visualization-container" v-if="selectedWarehouseDetails.data.profiles && selectedWarehouseDetails.data.profiles.length > 0">
              <h4>Profiles</h4>
              <div class="cubes-grid">
                <div 
                  v-for="(item, index) in selectedWarehouseDetails.data.profiles" 
                  :key="'profile-' + index"
                  class="cube-item"
                >
                  <svg :width="getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.profiles)) + 20" :height="getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.profiles)) + 30" class="cube-svg">
                    <g :transform="`translate(10, 10)`">
                      <!-- Cube - Front face (purple for profiles) -->
                      <rect 
                        x="0" 
                        :y="15" 
                        :width="getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.profiles)) - 15"
                        :height="getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.profiles)) - 15"
                        fill="#9C27B0" 
                        stroke="#6A1B9A" 
                        stroke-width="2"
                      />
                      <!-- Cube - Top face -->
                      <path 
                        :d="`M 0,15 L 15,0 L ${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.profiles))},0 L ${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.profiles)) - 15},15 Z`"
                        fill="#BA68C8" 
                        stroke="#6A1B9A" 
                        stroke-width="2"
                      />
                      <!-- Cube - Right face -->
                      <path 
                        :d="`M ${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.profiles)) - 15},15 L ${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.profiles))},0 L ${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.profiles))},${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.profiles)) - 15} L ${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.profiles)) - 15},${getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.profiles))} Z`"
                        fill="#7B1FA2" 
                        stroke="#6A1B9A" 
                        stroke-width="2"
                      />
                      <!-- Count text (only count, no weight for profiles) -->
                      <text 
                        :x="(getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.profiles)) - 15) / 2"
                        :y="15 + (getCubeSize(item.count, getMaxCount(selectedWarehouseDetails.data.profiles)) - 15) / 2 + 5"
                        text-anchor="middle" 
                        fill="#fff" 
                        font-size="18" 
                        font-weight="bold"
                      >
                        {{ item.count }}
                      </text>
                    </g>
                  </svg>
                  <div class="cube-label">
                    <span class="profile-name">{{ item.profile_name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </template>
          
          <!-- No Data State -->
          <div v-else class="no-data">
            <p>No data available</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ADD: Cargo Details Dialog -->
    <div v-if="showCargoDialog" class="cargo-dialog-overlay" @click.self="closeCargoDialog">
      <div class="cargo-dialog">
        <!-- Dialog Header -->
        <div class="dialog-header" :class="{ 
          'header-green': selectedShipment.shipment_type === 'Incoming', 
          'header-blue': selectedShipment.shipment_type === 'Outgoing',
          'header-loading': loadingCargoDetails
        }">
          <h2>
            <span v-if="loadingCargoDetails">📦 Loading...</span>
            <span v-else-if="selectedShipment?.shipment_type === 'Incoming'">📦 Incoming Cargo</span>
            <span v-else>📦 Outgoing Cargo</span>
          </h2>
          <h3 v-if="selectedShipment">{{ selectedShipment.license_number }}</h3>
          <button class="close-btn" @click="closeCargoDialog">✕</button>
        </div>
        
        <!-- Loading State -->
        <div v-if="loadingCargoDetails" class="dialog-loading">
          <div class="spinner"></div>
          <p>Loading cargo details...</p>
        </div>

        <!-- Dialog Content -->
        <div v-else-if="selectedShipment" class="dialog-content cargo-content">
          <!-- INCOMING SHIPMENT VIEW -->
          <template v-if="selectedShipment.shipment_type === 'Incoming'">
            <div class="cargo-info-grid">
              <div class="cargo-info-item">
                <span class="info-icon">📋</span>
                <div class="info-details">
                  <span class="info-label">Material Type</span>
                  <span class="info-value">{{ selectedShipment.material_type || 'N/A' }}</span>
                </div>
              </div>
              
              <div class="cargo-info-item">
                <span class="info-icon">🏭</span>
                <div class="info-details">
                  <span class="info-label">Material Name</span>
                  <span class="info-value">{{ selectedShipment.material_name || 'N/A' }}</span>
                </div>
              </div>
              
              <div class="cargo-info-item">
                <span class="info-icon">🚚</span>
                <div class="info-details">
                  <span class="info-label">Supplier</span>
                  <span class="info-value supplier-name">{{ selectedShipment.supplier_name || 'N/A' }}</span>
                </div>
              </div>
              
              <div class="cargo-info-item" v-if="selectedShipment.quantity">
                <span class="info-icon">📊</span>
                <div class="info-details">
                  <span class="info-label">Quantity</span>
                  <span class="info-value">{{ selectedShipment.quantity }} {{ selectedShipment.unit || '' }}</span>
                </div>
              </div>
              
              <div class="cargo-info-item" v-if="selectedShipment.net_weight">
                <span class="info-icon">⚖️</span>
                <div class="info-details">
                  <span class="info-label">Net Weight</span>
                  <span class="info-value">{{ selectedShipment.net_weight }} kg</span>
                </div>
              </div>
              
              <div class="cargo-info-item" v-if="selectedShipment.unload_location">
                <span class="info-icon">📍</span>
                <div class="info-details">
                  <span class="info-label">Destination</span>
                  <span class="info-value">{{ formatWarehouseName(selectedShipment.unload_location) }}</span>
                </div>
              </div>
            </div>
          </template>
          
          <!-- OUTGOING SHIPMENT VIEW -->
          <template v-else>
            <div class="cargo-info-grid">
              <div class="cargo-info-item">
                <span class="info-icon">👤</span>
                <div class="info-details">
                  <span class="info-label">Customer</span>
                  <span class="info-value customer-name">{{ selectedShipment.customer_name || 'N/A' }}</span>
                </div>
              </div>
              
              <div class="cargo-info-item">
                <span class="info-icon">📊</span>
                <div class="info-details">
                  <span class="info-label">Quantity</span>
                  <span class="info-value">{{ parseReelsList(selectedShipment.list_of_reels).length }} Reels</span>
                </div>
              </div>
              
              <div class="cargo-info-item" v-if="selectedShipment.net_weight">
                <span class="info-icon">⚖️</span>
                <div class="info-details">
                  <span class="info-label">Net Weight</span>
                  <span class="info-value">{{ selectedShipment.net_weight }} kg</span>
                </div>
              </div>
            </div>
            
            <!-- Reels List -->
            <div class="reels-section" v-if="selectedShipment.list_of_reels">
              <h4>🧻 Reel Numbers</h4>
              <div class="reels-grid">
                <span 
                  v-for="(reel, index) in parseReelsList(selectedShipment.list_of_reels)" 
                  :key="index"
                  class="reel-badge"
                >
                  {{ reel }}
                </span>
              </div>
            </div>
          </template>
          
          <!-- Status Badge -->
          <div class="status-section">
            <span class="status-badge" :class="'status-' + selectedShipment.status.toLowerCase()">
              {{ selectedShipment.status }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Sidebar with Title, Buttons, and Footer -->
    <div class="right-sidebar">
      <div class="sidebar-top">
        <h1 class="map-title">نقشه کارخانه<br/>Factory Map</h1>
        
        <button 
          class="refresh-button"
          @click="handleRefresh"
          :disabled="loading"
        >
          <span v-if="loading">در حال بارگذاری...</span>
          <span v-else>بروزرسانی ↻</span>
        </button>
        
        <router-link
          to="/myapp/"
          class="back-button"
        >
          → بازگشت به صفحه اصلی
        </router-link>
      </div>
      
      <div class="sidebar-footer">
        <p style="font-weight: bold; margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 6px; font-size: 12px;">Slow Motion Workflow:</p>
        <p style="font-size: 9px; line-height: 1.8;">
          <strong>Registered:</strong><br/>
          Entrance → W.Station 1 (15s) ⚠️<br/>
          <strong>LoadingUnloading:</strong><br/>
          At Warehouse + Forklift 🚜<br/>
          <strong>LoadedUnloaded:</strong><br/>
          Warehouse → W.Station 2 (15s)<br/>
          <strong>Office:</strong><br/>
          W.Station 2 → Office<br/>
          <strong>Delivered:</strong><br/>
          Office → Street (Exit)
        </p>
        
        <p style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3); font-weight: bold;">
          Locations:
        </p>
        <p style="font-size: 10px;">
          🏭 8 Warehouses<br/>
          ⚖️ 2 Weight Stations<br/>
          🚜 4 Forklifts<br/>
          🚪 2 Entrance/Exit
        </p>
        <p style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.3);">
          <strong>Total Inventory:</strong><br/>
          <span style="font-size: 16px; color: #ffeb3b;">{{ totalInventory }}</span> Reels
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.factory-map-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ffffff;
  display: flex;
  flex-direction: row;
  direction: rtl;
  overflow: hidden;
}

.right-sidebar {
  width: 250px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.sidebar-top {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 11px;
  font-family: monospace;
  line-height: 1.8;
}

.sidebar-footer p {
  margin: 4px 0;
}

.map-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  font-family: Tahoma, Arial, sans-serif;
  text-align: center;
  line-height: 1.4;
  padding-bottom: 15px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
}

.refresh-button,
.back-button {
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid white;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: Tahoma, Arial, sans-serif;
  text-decoration: none;
  display: block;
  text-align: center;
  width: 100%;
}

.refresh-button:hover:not(:disabled),
.back-button:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.02);
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error-banner {
  background: #fee;
  color: #c33;
  padding: 12px 30px;
  text-align: center;
  font-weight: 600;
  border-bottom: 2px solid #c33;
  flex-shrink: 0;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  margin-top: 20px;
  font-size: 16px;
  color: #666;
  font-family: Tahoma, Arial, sans-serif;
}

.svg-container {
  flex: 1;
  width: 100%;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fafafa;
  overflow: hidden;
}

.factory-svg {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: 100%;
  background: white;
}

/* Dynamic elements - Smooth transition when data updates */
.truck-animated {
  cursor: pointer;
  /* Transition handled via inline style for better control */
}

/* Keep inner elements without transition */
.truck-animated * {
  transition: none !important;
}

/* Animated workflow paths */
.path-animation {
  stroke-dashoffset: 0;
  animation: dash-flow 3s linear infinite;
}

@keyframes dash-flow {
  0% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -50;
  }
}

/* Arrow pulse animation along paths */
.arrow-pulse {
  animation: arrow-move 2s ease-in-out infinite;
  transform-origin: center;
}

@keyframes arrow-move {
  0%, 100% {
    opacity: 0.6;
    transform: scale(1) translateX(0);
  }
  50% {
    opacity: 1;
    transform: scale(1.3) translateX(10px);
  }
}

.truck-animated:hover {
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

/* .truck-animated:hover g {
  transform: scale(1.1);
  transition: transform 0.2s ease;
} */

/* Forklift animations - More dramatic motion */
.forklift-animated {
  cursor: pointer;
}

.forklift-animated g {
  animation: forklift-work 2.5s ease-in-out infinite;
  transform-origin: center;
}

@keyframes forklift-work {
  0%, 100% {
    transform: translateX(0) translateY(0) rotate(0deg);
  }
  10% {
    transform: translateX(-5px) translateY(-2px) rotate(-3deg);
  }
  25% {
    transform: translateX(-15px) translateY(0) rotate(-5deg);
  }
  40% {
    transform: translateX(-8px) translateY(2px) rotate(-2deg);
  }
  50% {
    transform: translateX(0) translateY(0) rotate(0deg);
  }
  60% {
    transform: translateX(8px) translateY(-2px) rotate(2deg);
  }
  75% {
    transform: translateX(15px) translateY(0) rotate(5deg);
  }
  90% {
    transform: translateX(5px) translateY(2px) rotate(3deg);
  }
}

/* Blinking animation for forklift indicator */
.blink-animation {
  animation: blink 1s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.2;
  }
}

/* Warehouse badges */
.warehouse-badges circle {
  cursor: pointer;
  transition: all 0.3s ease;
}

.warehouse-badges > g:hover circle {
  r: 20;
  opacity: 1;
}

/* Products circle (green) hover effect */
.warehouse-badges > g:hover > g:first-child circle {
  filter: drop-shadow(0 0 12px rgba(76, 175, 80, 0.8));
}

/* Raw materials circle (orange) hover effect */
.warehouse-badges > g:hover > g:nth-child(2) circle {
  filter: drop-shadow(0 0 12px rgba(255, 152, 0, 0.8));
}

.warehouse-badges text {
  pointer-events: none;
  user-select: none;
  transition: all 0.3s ease;
}

.warehouse-badges > g:hover text {
  font-size: 11px;
}

/* Animation for warehouse badges on load */
@keyframes badge-pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.warehouse-badges > g > g {
  animation: badge-pulse 2s ease-in-out infinite;
}

.warehouse-badges > g > g:nth-child(2) {
  animation-delay: 0.3s;
}

.data-info {
  pointer-events: none;
}

/* Smooth entry animation for trucks - DISABLED to prevent animation repeating */
@keyframes truck-enter {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Commented out to prevent animation repeating on every render */
/* .truck-animated g {
  animation: truck-enter 0.5s ease-out;
} */

/* Motion trail effect */
.trail-pulse {
  animation: trail-fade 1s ease-out infinite;
}

@keyframes trail-fade {
  0% {
    opacity: 0.4;
    rx: 30;
  }
  50% {
    opacity: 0.2;
  }
  100% {
    opacity: 0;
    rx: 50;
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .right-sidebar {
    width: 150px;
  }
  
  .sidebar-top {
    padding: 15px 10px;
    gap: 10px;
  }
  
  .sidebar-footer {
    padding: 15px 10px;
    font-size: 10px;
  }
  
  .map-title {
    font-size: 14px;
  }
  
  .refresh-button,
  .back-button {
    padding: 8px 12px;
    font-size: 11px;
  }
}

/* ============================================ */
/* INVENTORY DIALOG STYLES */
/* ============================================ */

.inventory-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.inventory-dialog {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 900px;
  max-height: 85vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: dialog-enter 0.3s ease-out;
}

@keyframes dialog-enter {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(-20px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.dialog-header {
  padding: 20px 25px;
  position: relative;
  color: #fff;
}

.dialog-header.header-green {
  background: linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%);
}

.dialog-header.header-orange {
  background: linear-gradient(135deg, #FF9800 0%, #E65100 100%);
}

.dialog-header h2 {
  margin: 0 0 5px 0;
  font-size: 22px;
  font-weight: 600;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
  font-weight: 400;
}

.close-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 50%;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.dialog-loading {
  padding: 60px 20px;
  text-align: center;
}

.dialog-loading .spinner {
  width: 50px;
  height: 50px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

.dialog-content {
  padding: 25px;
  overflow-y: auto;
  max-height: calc(85vh - 120px);
}

/* Summary Stats */
.summary-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.stat-box {
  flex: 1;
  min-width: 150px;
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  color: #fff;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.stat-box.stat-green {
  background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
}

.stat-box.stat-orange {
  background: linear-gradient(135deg, #FF9800 0%, #FFB74D 100%);
}

.stat-box.stat-blue {
  background: linear-gradient(135deg, #2196F3 0%, #64B5F6 100%);
}

.stat-box.stat-purple {
  background: linear-gradient(135deg, #9C27B0 0%, #BA68C8 100%);
}

.stat-value {
  display: block;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 5px;
}

.stat-label {
  display: block;
  font-size: 13px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Visualization Container */
.visualization-container {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.visualization-container h4 {
  margin: 0 0 20px 0;
  font-size: 16px;
  color: #333;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 10px;
}

/* Cylinders Grid */
.cylinders-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
  justify-content: center;
  align-items: flex-end;
}

.cylinder-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 90px;
}

.cylinder-svg {
  display: block;
}

.cylinder-label {
  margin-top: 10px;
  text-align: center;
}

.width-value {
  font-size: 14px;
  font-weight: 600;
  color: #2E7D32;
  background: #E8F5E9;
  padding: 4px 12px;
  border-radius: 20px;
}

/* Cubes Grid */
.cubes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 25px;
  justify-content: center;
  align-items: flex-end;
}

.cube-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.cube-svg {
  display: block;
}

.cube-label {
  margin-top: 10px;
  text-align: center;
  max-width: 120px;
}

.material-name, .profile-name {
  font-size: 12px;
  font-weight: 600;
  color: #E65100;
  background: #FFF3E0;
  padding: 4px 10px;
  border-radius: 8px;
  display: inline-block;
  word-break: break-word;
  line-height: 1.3;
}

.profile-name {
  color: #6A1B9A;
  background: #F3E5F5;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #666;
}

.no-data-section {
  text-align: center;
  padding: 30px;
  background: #f5f5f5;
  border-radius: 12px;
  color: #666;
  font-size: 14px;
  margin-bottom: 20px;
}

.no-data-section p {
  margin: 0;
}

/* Clickable circles */
.clickable-circle {
  cursor: pointer;
  transition: all 0.2s ease;
}

.clickable-circle:hover {
  transform: scale(1.15);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3));
}

.clickable-circle:hover circle {
  stroke-width: 4;
}

/* ============================================ */
/* CARGO DIALOG STYLES */
/* ============================================ */

.cargo-clickable {
  cursor: pointer;
  transition: all 0.2s ease;
}

.cargo-clickable:hover {
  filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4));
  transform: scale(1.05);
}

.cargo-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.cargo-dialog {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: dialog-enter 0.3s ease-out;
}

.header-blue {
  background: linear-gradient(135deg, #2196F3 0%, #1565C0 100%);
}

.cargo-content {
  padding: 25px;
}

.cargo-info-grid {
  display: grid;
  gap: 15px;
}

.cargo-info-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 12px;
  border-left: 4px solid #667eea;
}

.info-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.info-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.supplier-name, .customer-name {
  color: #1565C0;
}

.reels-section {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #e0e0e0;
}

.reels-section h4 {
  margin: 0 0 15px 0;
  font-size: 16px;
  color: #333;
}

.reels-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.reel-badge {
  display: inline-block;
  padding: 6px 12px;
  background: linear-gradient(135deg, #2196F3 0%, #64B5F6 100%);
  color: #fff;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  font-family: monospace;
}

.status-section {
  margin-top: 20px;
  text-align: center;
}

.status-badge {
  display: inline-block;
  padding: 8px 20px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.status-registered {
  background: #FFF3E0;
  color: #E65100;
}

.status-loadingunloading {
  background: #FCE4EC;
  color: #C2185B;
}

.status-loadedunloaded {
  background: #E3F2FD;
  color: #1565C0;
}

.status-office {
  background: #F3E5F5;
  color: #7B1FA2;
}

.status-delivered {
  background: #E8F5E9;
  color: #2E7D32;
}

</style>
