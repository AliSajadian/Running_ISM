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
        'Anbar_Akhal': { x: 200, y: 905 },
        'Entrance1': { x: 320, y: 760 },
        'Weight_Station_1': { x: 390, y: 540 },
        'Otagh_Estrahat': { x: 120, y: 600 },
        'Restaurant': { x: 40, y: 440 },
        'Anbar_Salon_Tolid': { x: 140, y: 237 },
        'Anbar_Parvandeh': { x: 335, y: 94 },
        'Anbar_Koochak': { x: 335, y: 170 },
        'Anbar_Mohavate_Homayoun': { x: 550, y: 150 },
        'Anbar_Khamir_Ghadim': { x: 805, y: 150 },
        'Anbar_Sangin': { x: 660, y: 560 },
        'QC': { x: 845, y: 580 },
        'Loading_Unloading': { x: 510, y: 610 },
        'Anbar_Mohavate_Kardan': { x: 1090, y: 140 },
        'Anbar_Khamir_Kordan': { x: 1090, y: 180 },
        'Weight_Station_2': { x: 1170, y: 370 },
        'Office': { x: 1070, y: 650 },
        'Entrance2': { x: 1070, y: 760 }, 
        'Anbar_PAK': { x: 1410, y: 620 },
      },
      truckStopPositions: {
        'Entrance1': { x: 390, y: 760 },  // Left entrance - moved under W1
        'Weight_Station_1': { x: 350, y: 540 },
        'Anbar_Salon_Tolid': { x: 350, y: 300 },
        'Anbar_Akhal': { x: 160, y: 825 },
        'Anbar_PAK': { x: 1410, y: 820 },
        'Anbar_Khamir_Kordan': { x: 1090, y: 180 },
        'Anbar_Mohavate_Kardan': { x: 1090, y: 140 },
        'Anbar_Khamir_Ghadim': { x: 805, y: 150 },
        'Anbar_Mohavate_Homayoun': { x: 550, y: 150 },
        'Anbar_Parvandeh': { x: 355, y: 94 },
        'Anbar_Koochak': { x: 355, y: 170 },
        'Anbar_Sangin': { x: 640, y: 500 },
        'Loading_Unloading': { x: 390, y: 540 },
        'Weight_Station_2': { x: 1145, y: 340 },
        'Office': { x: 1070, y: 650 },
        'Entrance2': { x: 1070, y: 760 },  
      },
      // Warehouse badge positions
      warehouseBadgePositions: {
        'Anbar_PAK': { x: 1410, y: 460 },
        'Anbar_Sangin': { x: 845, y: 405 },
        'Anbar_Khamir_Kordan': { x: 1320, y: 75 },
        'Anbar_Mohavate_Kardan': { x: 980, y: 15 },
        'Anbar_Khamir_Ghadim': { x: 860, y: 15 },
        'Anbar_Mohavate_Homayoun': { x: 500, y: 85 },
        'Anbar_Parvandeh': { x: 360, y: 75 },
        'Anbar_Koochak': { x: 360, y: 125 },
        'Anbar_Salon_Tolid': { x: 130, y: 15 },
        'Anbar_Akhal': { x: 300, y: 860 },
      },
      truckAnimations: {}, // Store animated positions { truckId: { currentX, currentY, rotation, animating } }
      animationFrames: {},  // Store RAF IDs for cleanup
      
      // Forklift animation state
      forkliftAnimations: {}, // { shipmentId: { currentX, currentY, hasCargo, phase, animating } }
      forkliftAnimationFrames: {}, // RAF IDs for cleanup
      forkliftUpdateCounter: 0,

      // Forklift positions at warehouses (where forklift waits/loads at warehouse)
      forkliftWarehousePositions: {
        'Anbar_Salon_Tolid': { x: 140, y: 300 },
        'Anbar_Sangin': { x: 760, y: 460 },
        'Anbar_Koochak': { x: 400, y: 180 },
        'Anbar_Parvandeh': { x: 400, y: 100 },
        'Anbar_Khamir_Ghadim': { x: 720, y: 100 },
        'Anbar_Mohavath_Homayoun': { x: 520, y: 180 },
        'Anbar_Khamir_Kordan': { x: 1220, y: 180 },
        'Anbar_Muhvateh_Kardan': { x: 980, y: 105 },
        'Anbar_PAK': { x: 1380, y: 750 },
        'Anbar_Akhal': { x: 200, y: 870 },
      },
      forkliftTruckPositions: {
        'Anbar_Salon_Tolid': { x: 320, y: 300 },
        'Anbar_Sangin': { x: 640, y: 460 },
        'Anbar_Koochak': { x: 400, y: 180 },
        'Anbar_Parvandeh': { x: 400, y: 100 },
        'Anbar_Khamir_Ghadim': { x: 620, y: 100 },
        'Anbar_Mohavath_Homayoun': { x: 520, y: 180 },
        'Anbar_Muhvateh_Kardan': { x: 1070, y: 105 },
        'Anbar_Khamir_Kordan': { x: 1120, y: 180 },
        'Anbar_PAK': { x: 1380, y: 750 },
        'Anbar_Akhal': { x: 200, y: 870 },
      },

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
      forkliftAudios: {},  // Audio instance per forklift

      // WebSocket for movement notifications
      movementWebSocket: null,
      warehouseMovementQueue: [],  // Queue of pending movements
      activeWarehouseMovement: null,  // Currently animating movement  
      
      // Warehouse-to-warehouse movement animation
      warehouseForkliftAnimations: {},  // { movementId: { currentX, currentY, hasCargo, animating } }
      warehouseForkliftAnimationFrames: {},  // RAF IDs for cleanup
      processingMovementQueue: false,  // Flag to prevent multiple queue processing

      // Cylinder(Reels) configuration
      cylinderConfig: {
        'Anbar_Salon_Tolid': {
          startX: 70,
          startY: 330,
          spacingX: 25,
          spacingY: 55,
          cylindersPerRow: 6,
          radius: { rx: 10, ry: 4 },
          height: 30,
          maxRows: 2
        },
        'Anbar_Sangin': {
          startX: 740,
          startY: 490,
          spacingX: 25,
          spacingY: 55,
          cylindersPerRow: 6,
          radius: { rx: 10, ry: 4 },
          height: 30,
          maxRows: 2
        },
        'Anbar_Khamir_Ghadim': {
          startX: 740,
          startY: 50,
          spacingX: 25,
          spacingY: 55,
          cylindersPerRow: 6,
          radius: { rx: 10, ry: 4 },
          height: 30,
          maxRows: 2
        }
      },    

      // Add after cylinderConfig in data()
      akhalPackConfig: {
        'Anbar_Akhal': {
          startX: 125,
          startY: 890,
          spacingX: 40,
          spacingY: 0,  // Single row
          packsPerRow: 5,
          maxRows: 2
        },
        'Anbar_Khamir_Kordan': {
          startX: 1220,
          startY: 200,
          spacingX: 40,
          spacingY: 40,
          packsPerRow: 3,
          maxRows: 2
        },
        'Anbar_Mohavate_Kardan': {
          startX: 975,
          startY: 10,
          spacingX: 0,
          spacingY: 40,
          packsPerRow: 1,
          maxRows: 3
        },
        'Anbar_Khamir_Ghadim': {
          startX: 585,
          startY: 15,
          spacingX: 40,
          spacingY: 0,
          packsPerRow: 3,
          maxRows: 1
        },
        'Anbar_Mohavate_Homayoun': {
          startX: 450,
          startY: 95,
          spacingX: 40,
          spacingY: 0,
          packsPerRow: 2,
          maxRows: 2
        },
        'Anbar_PAK': {
          startX: 1387,
          startY: 475,
          spacingX: 0,
          spacingY: 45,
          packsPerRow: 1,
          maxRows: 5
        }
      },    

      tooltip: {
        visible: false,
        content: '',
        x: 0,
        y: 0
      },
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

    /**
     * Get forklift cargo states
     */
     forkliftCargoStates() {
      const counter = this.forkliftUpdateCounter;      
      const states = {};
      Object.keys(this.forkliftAnimations).forEach(key => {
        states[key] = this.forkliftAnimations[key]?.hasCargo || false;
      });
      return states;
    },
  },
  mounted() {
    this.fetchMapData()
    this.startPolling()
    // this.initTruckAudio()

    // Connect to movement WebSocket
    this.connectMovementWebSocket()

    document.addEventListener('click', () => {
      if (this.truckAudio) {
        this.truckAudio.play().then(() => {
          this.truckAudio.pause();
        }).catch(() => {});
      }
    }, { once: true })
  },
  beforeUnmount() {
    this.stopPolling()
  
    // Disconnect movement WebSocket
    this.disconnectMovementWebSocket()

    // Cancel all animations
    Object.values(this.animationFrames).forEach(frameId => {
      cancelAnimationFrame(frameId);
    });

    // Cancel all forklift animations
    Object.keys(this.forkliftAnimationFrames).forEach(id => {
      cancelAnimationFrame(this.forkliftAnimationFrames[id]);
    });

    // Cancel all warehouse movement animations
    Object.keys(this.warehouseForkliftAnimationFrames).forEach(id => {
      cancelAnimationFrame(this.warehouseForkliftAnimationFrames[id]);
    });

    this.stopAllTruckSounds()
    this.stopAllForkliftSounds()
  },
  methods: {
    /**
     * Connect to movement WebSocket for real-time warehouse movement notifications
     */
     connectMovementWebSocket() {
      // Determine WebSocket URL based on current location
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.hostname
      const port = '8000'  // Django backend port
      const wsUrl = `${protocol}//${host}:${port}/ws/movements/`
      
      console.log('🔌 Connecting to movement WebSocket:', wsUrl)
      
      try {
        this.movementWebSocket = new WebSocket(wsUrl)
        
        this.movementWebSocket.onopen = () => {
          console.log('✅ Movement WebSocket connected')
        }
        
        this.movementWebSocket.onmessage = (event) => {
          const data = JSON.parse(event.data)
          console.log('📦 Message received:', data)
          
          if (data.type === 'movement') {
            // Add movement to queue
            this.warehouseMovementQueue.push({
              from_anbar: data.from_anbar,
              to_anbar: data.to_anbar,
              quantity: data.quantity,
              material_type: data.material_type,
              pending: data.pending
            })
            
            // Start processing queue if not already animating
            // TODO: Will implement animation in step 5
            console.log('📋 Movement queued. Queue length:', this.warehouseMovementQueue.length)

            // Add delay for pending movements (sent on connect) to let page load first
            if (data.pending) {
              setTimeout(() => {
                this.processMovementQueue()
              }, 6000)  // 6 second delay for pending movements
            } else {
              // Real-time movements start immediately
              this.processMovementQueue()
            }
          }

          // Handle inventory update (NEW)
          if (data.type === 'loading_unloading_message') {
            console.log('🔄 Inventory update for:', data.warehouse_name)
            this.refreshWarehouseInventory(data.warehouse_name)
          }
        }
        
        this.movementWebSocket.onclose = (event) => {
          console.log('🔌 Movement WebSocket closed:', event.code, event.reason)
          // Reconnect after 5 seconds if not intentionally closed
          if (event.code !== 1000) {
            setTimeout(() => {
              console.log('🔄 Reconnecting movement WebSocket...')
              this.connectMovementWebSocket()
            }, 5000)
          }
        }
        
        this.movementWebSocket.onerror = (error) => {
          console.error('❌ Movement WebSocket error:', error)
        }
      } catch (error) {
        console.error('❌ Failed to create movement WebSocket:', error)
      }
    },
    
    /**
     * Disconnect from movement WebSocket
     */
    disconnectMovementWebSocket() {
      if (this.movementWebSocket) {
        console.log('🔌 Disconnecting movement WebSocket')
        this.movementWebSocket.close(1000, 'Component unmounting')
        this.movementWebSocket = null
      }
    },

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
      } catch (error) {
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
          
          // Debug: Show truck workflow states with START → END positions
          if (this.activeShipments.length > 0) {
            this.activeShipments.forEach(s => {
              const startPos = this.getTruckStartPosition(s)
              const endPos = this.getTruckEndPosition(s)
              const rotation = this.getTruckRotation(s)
              const rotationDesc = rotation === 0 ? 'Horizontal' : rotation === 90 ? 'Right (W1)' : 'Downward (W2)'
            })
          }
          
          // Debug: Check forklift conditions
          const loadingShipments = this.activeShipments.filter(s => s.status === 'LoadingUnloading')
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
                  return this.truckStopPositions['Anbar_Mohavate_Kardan'] || { x: 150, y: 1070 }
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
      return weight
    },

    /**
     * Get warehouse raw materials weight in kg
     */
    getWarehouseRawMaterialsWeight(warehouseName) {
      const details = this.warehouseInventoryDetails[warehouseName]
      const weight = details && details.raw_materials ? details.raw_materials.weight : 0
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
     * Generate smooth path with Catmull-Rom spline for truly smooth curves
     */
    generateSmoothPath(waypoints) {
    if (waypoints.length < 2) return waypoints;
    if (waypoints.length === 2) return waypoints;
    
    const smoothPath = [];
    const segments = 20;
    
    // Helper to check if segment is horizontal or vertical (straight)
    const isStraightSegment = (p1, p2) => {
      const dx = Math.abs(p2.x - p1.x);
      const dy = Math.abs(p2.y - p1.y);
      // Consider straight if one dimension barely changes
      return dx < 5 || dy < 5;
    };
    
    for (let i = 0; i < waypoints.length - 1; i++) {
      const p0 = waypoints[Math.max(i - 1, 0)];
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];
      const p3 = waypoints[Math.min(i + 2, waypoints.length - 1)];
      
      // Check if current segment is straight (horizontal or vertical)
      const currentStraight = isStraightSegment(p1, p2);
      
      if (currentStraight) {
        // Linear interpolation for straight segments
        for (let t = 0; t < segments; t++) {
          const s = t / segments;
          smoothPath.push({
            x: p1.x + (p2.x - p1.x) * s,
            y: p1.y + (p2.y - p1.y) * s
          });
        }
      } else {
        // Use Catmull-Rom for diagonal/curved segments
        for (let t = 0; t < segments; t++) {
          const s = t / segments;
          
          const x = 0.5 * (
            (2 * p1.x) +
            (-p0.x + p2.x) * s +
            (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * s * s +
            (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * s * s * s
          );
          
          const y = 0.5 * (
            (2 * p1.y) +
            (-p0.y + p2.y) * s +
            (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * s * s +
            (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * s * s * s
          );
          
          smoothPath.push({ x, y });
        }
      }
    }
    
    // Add final point
    smoothPath.push(waypoints[waypoints.length - 1]);
    
    return smoothPath;
    },

    /**
     * Animate truck along path - CONTINUOUS smooth motion
     */
    animateTruckAlongPath(shipment, waypoints) {
      if (!waypoints || waypoints.length < 2) return;
      
      const truckId = shipment.id;
      const smoothPath = this.generateSmoothPath(waypoints);
      
      // Calculate total path length for consistent speed
      let totalLength = 0;
      const segmentLengths = [];
      for (let i = 0; i < smoothPath.length - 1; i++) {
        const dx = smoothPath[i + 1].x - smoothPath[i].x;
        const dy = smoothPath[i + 1].y - smoothPath[i].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        segmentLengths.push(len);
        totalLength += len;
      }
      
      // Duration based on path length (pixels per second)
      const speed = 100;  // pixels per second
      const totalDuration = (totalLength / speed) * 1000;  // Convert to ms
      
      this.playTruckSound(truckId);
      
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / totalDuration, 1);
        
        // Easing for smooth start/stop
        const easeProgress = progress < 0.5 
          ? 2 * progress * progress 
          : -1 + (4 - 2 * progress) * progress;
        
        // Find position along path based on progress
        const targetDistance = easeProgress * totalLength;
        let accumulatedDistance = 0;
        let pointIndex = 0;

        for (let i = 0; i < segmentLengths.length; i++) {
          if (accumulatedDistance + segmentLengths[i] >= targetDistance) {
            pointIndex = i;
            break;
          }
          accumulatedDistance += segmentLengths[i];
        }
        
        // Interpolate within the segment
        const segmentProgress = segmentLengths[pointIndex] > 0 
          ? (targetDistance - accumulatedDistance) / segmentLengths[pointIndex]
          : 0;
        
        const p1 = smoothPath[pointIndex];
        const p2 = smoothPath[Math.min(pointIndex + 1, smoothPath.length - 1)];
        
        const currentX = p1.x + (p2.x - p1.x) * segmentProgress;
        const currentY = p1.y + (p2.y - p1.y) * segmentProgress;
        
        // Calculate rotation from direction
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        
        // atan2 gives angle from positive X axis (-180 to 180)
        // We need: 0 = moving right, -90 = moving up, 90 = moving down, ±180 = moving left
        let rotation = Math.atan2(dy, dx) * (180 / Math.PI);

        // When moving left (rotation between 90 and 270 degrees), 
        // we need to flip the truck and adjust rotation to keep wheels down
        let flipX = 1;
        const snapThreshold = 20; // degrees
        if (Math.abs(rotation) <= snapThreshold) {
          rotation = 0;  // Moving right
        } else if (Math.abs(rotation - 90) <= snapThreshold) {
          rotation = 90;  // Moving down
        } else if (Math.abs(rotation + 90) <= snapThreshold) {
          rotation = -90;  // Moving up
        } else if (Math.abs(rotation) >= 180 - snapThreshold) {
          rotation = 180;  // Moving left (will be flipped below)
        }
        
        // Only flip for HORIZONTAL left movement (not diagonal or vertical)
        // Flip when rotation is close to ±180° (within 45° of horizontal-left)
        if (rotation > 135 || rotation < -135) {
          // Primarily horizontal-left movement - flip to keep wheels down
          flipX = -1;
          rotation = rotation > 0 ? rotation - 180 : rotation + 180;
        }
        // For all other angles (right, up, down, diagonals), no flip needed

        this.truckAnimations[truckId] = {
          currentX,
          currentY,
          rotation,
          animating: true,
          exited: false,
          flipX  // track horizontal flip        
        };
        
        if (progress < 1) {
          this.animationFrames[truckId] = requestAnimationFrame(animate);
        } else {
          // Animation complete
          this.truckAnimations[truckId].animating = false;

          if (shipment.status === 'Delivered') {
            this.truckAnimations[truckId].exited = true;
          }
          
          if (shipment.status === 'LoadingUnloading' && shipment.unload_location) {
            const forkliftId = 'forklift-' + truckId;
            if (!this.forkliftAnimations[forkliftId]?.animating) {
              this.startForkliftAnimation(shipment);
              this.playForkliftSound(truckId);
            }
          }
          
          this.stopTruckSound(truckId);
        }
      };
      
      animate();
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
                { x: 1070, y: 820 },  // Entrance2
                { x: 1070, y: 720 },  //   
                { x: 1145, y: 500 },  //    
                { x: 1145, y: 340 }   // W2   
              ];
            }
            else {
              return [
                { x: 0, y: 820 },    // Street
                { x: 350, y: 820 },  // Entrance1
                { x: 350, y: 510 }   // W1
              ];
            }
          } else {
            return [
              { x: 0, y: 820 },    // Street
              { x: 350, y: 820 },  // Entrance1
              { x: 350, y: 510 }   // W1
            ];
          }
        case'LoadingUnloading':
          if (type === 'Incoming') {
            if(material_type && material_type.indexOf('لوله مقوایی') !== -1) {
              return [
                { x: 350, y: 500 },  // W1
                { x: 350, y: 300 }   // Anbar Salon Tolid
              ];
            }
            else {
              switch(unload_location) {
                case 'Anbar_Salon_Tolid':
                  return [
                    { x: 350, y: 500 },  // W1
                    { x: 350, y: 300 }   // W1
                  ];
                case 'Anbar_Sangin':
                  return [
                    { x: 350, y: 500 },   // W1
                    { x: 350, y: 280 },   // turn right towards anbar sangin
                    { x: 640, y: 280 },   // reach anbar sangin
                    { x: 640, y: 480 },   // anbar sangin
                    ];
                case 'Anbar_Koochak':
                  return [
                    { x: 350, y: 500 },  // W1
                    { x: 350, y: 260 },  // turn right towards anbar koochak
                    { x: 360, y: 260 },  // turn left towards anbar koochak
                    { x: 360, y: 150 },  // Anbar koochak
                  ];
                case'Anbar_Parvandeh':
                  return [
                    { x: 350, y: 500 },  // W1
                    { x: 350, y: 260 },  // turn right towards anbar Parvandeh
                    { x: 360, y: 260 },  // turn left towards anbar Parvandeh
                    { x: 360, y: 120 },  // Anbar Parvandeh            
                  ];
                case 'Anbar_Mohavath_Homayoun':
                  return [
                    { x: 350, y: 500 },  // W1
                    { x: 350, y: 260 },  // turn right towards anbar Mohavath_Homayoun
                    { x: 460, y: 260 },  // turn left towards anbar Mohavath_Homayoun
                    { x: 460, y: 200 },  // Anbar Mohavath_Homayoun            
                  ];
                case 'Anbar_Khamir_Ghadim':
                  return [
                    { x: 350, y: 500 },  // W1
                    { x: 350, y: 260 },  // turn right towards anbar Mohavath_Homayoun
                    { x: 600, y: 260 },  // turn left towards anbar Mohavath_Homayoun
                    { x: 600, y: 150 },  // Anbar Mohavath_Homayoun            
                    ];
                case 'Anbar_Muhvateh_Kardan':
                  return [
                    { x: 1150, y: 370 },    // W2
                    { x: 1150, y: 140 },    // Anbar Muhvateh Kordan  
                    { x: 970, y: 140 },
                  ];
                case 'Anbar_Khamir_Kordan':
                  return [
                    { x: 1145, y: 340 },    // W2
                    { x: 1145, y: 180 },    // Anbar KHamir Kordan  
                    { x: 970, y: 180 },                   
                  ];
                case 'Anbar_PAK':
                  return [
                    { x: 350, y: 500 },  // W1
                    { x: 350, y: 820 },  // towards out of factory
                    { x: 1350, y: 820 }, // Start from current or W1
                  ];
                case 'Anbar_Akhal':
                  return [
                    { x: 350, y: 500 },  // W1
                    { x: 350, y: 830 },  // towards out of factory
                    { x: 120, y: 830 },  // Start from current or W1
                  ];
                default: 
                  if(material_type && material_type.indexOf('آخال') !== -1) {
                    return [
                      { x: 1145, y: 340 }   // W2          
                    ];
                  }
                  else {
                    return [
                      { x: 350, y: 500 }   // W1
                    ];
                  }
              }
            }
          }
          else {
            switch(unload_location) {
                case 'Anbar_Salon_Tolid':
                  return [
                    { x: 350, y: 500 },
                    { x: 320, y: 260 },
                    { x: 450, y: 260 },
                  ];
                case 'Anbar_Sangin':
                  return [
                    { x: 350, y: 500 },   // w1
                    { x: 350, y: 300 },   // turn right towards anbar sangin
                    { x: 660, y: 300 },   // reach anbar sangin
                    { x: 660, y: 560 },   // turn right towards W1
                  ];
                case 'Anbar_Khamir_Ghadim':
                  return [
                    { x: 350, y: 500 },  // W1
                    { x: 350, y: 260 },  // turn right towards anbar Mohavath_Homayoun
                    { x: 680, y: 260 },  // turn left towards anbar Mohavath_Homayoun
                    { x: 680, y: 140 },  // turn left towards anbar Mohavath_Homayoun
                    { x: 580, y: 140 },  // turn left towards anbar Mohavath_Homayoun
                    // { x: 640, y: 230 },  // Anbar Mohavath_Homayoun            
                  ];
                default: 
                  return [
                    { x: 350, y: 500 },  // W1
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
                  { x: 350, y: 300 },     // Anbar Salon Tolid
                  { x: 350, y: 620 },    // W1
                ];
              case 'Anbar_Sangin':
                return [
                  { x: 660, y: 570 },     // anbar sangin
                  { x: 660, y: 700 },    // Before turning left
                  { x: 350, y: 700 },     // Turn right towards W1
                  { x: 350, y: 600 }     // Turn right towards W1
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
                  { x: 1090, y: 140 },  // move backward to Anbar_Khamir_Kordan     
                  { x: 1150, y: 180 },    // Before turning right
                  { x: 1150, y: 350 }     // Turn right towards W2
                ];
              case 'Anbar_Khamir_Kordan':
                return [
                  // { x: 1050, y: 180 }, 
                  { x: 1145, y: 180 },  //  Anbar_Khamir_Kordan     
                  { x: 1145, y: 440 }     //  W2
                ];
              case 'Anbar_PAK':
                return [
                  { x: 1320, y: 820 },   // towards out of factory
                  { x: 1020, y: 820 },   // turn right
                  { x: 1145, y: 370 }     //  W2
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
                  { x: 350, y: 260 },   // Anbar Salon Tolid
                  { x: 350, y: 620 },  // W1
                ];               
              case 'Anbar_Sangin':
                return [
                  { x: 660, y: 560 },   // anbar sangin
                  { x: 660, y: 300 },   // turn left 
                  { x: 350, y: 300 },   // turn left towards W1
                  { x: 350, y: 620 },   // W1
                ];
              case 'Anbar_Khamir_Ghadim':
                return [
                  { x: 600, y: 140 },  // Anbar Mohavath Kordan            
                  { x: 600, y: 260 },  // turn right towards anbar salon tolid
                  { x: 350, y: 260 },  // turn left towards W1
                  { x: 350, y: 620 },  // W1
                ];
              default: 
                return [
                  { x: 350, y: 620 },  // W1
                ]
            }
          }
        case 'Office':
          if (type === 'Incoming') {
            if(material_type && material_type.indexOf('آخال') !== -1) {
              return [
                { x: 1140, y: 410 },
                { x: 1070, y: 550 },
                { x: 1070, y: 720 },
              ];
            } else {
              return [
                currentPos || { x: 350, y: 540 },
                { x: 350, y: 600 },
                { x: 350, y: 720 },
              ];            
            }        
          } else {
            return [
                currentPos || { x: 350, y: 540 },
                { x: 350, y: 600 },
                { x: 350, y: 720 },
              ];            
          }
        case 'Delivered':
          if (type === 'Incoming') {
            if(material_type && material_type.indexOf('آخال') !== -1) {
              return [
                currentPos || { x: 1070, y: 720 },
                { x: 1070, y: 800 },   // Street
                { x: 0, y: 800 }   // Street
              ];
            } else {
              return [
                currentPos || { x: 350, y: 720 },
                { x: 350, y: 800 },   // Street
                { x: 0, y: 800 }   // Street
              ];            
            }        
          } else {
            return [
                currentPos || { x: 350, y: 720 },
                { x: 350, y: 800 }, 
                { x: 0, y: 800 }   // Street
              ];            
          }          
        default:
            return [];
      }
    },  

    /**
     * Get turn type based on waypoints path
     */
    detectTurnType(p1, p2, p3) {
      // Calculate angle between two segments
      const angle1 = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const angle2 = Math.atan2(p3.y - p2.y, p3.x - p2.x);
      let angleDiff = Math.abs(angle2 - angle1) * (180 / Math.PI);
      if (angleDiff > 180) angleDiff = 360 - angleDiff;
      
      if (angleDiff < 45) return 'slight';
      if (angleDiff < 135) return 'corner';  // ~90 degrees
      return 'uturn';  // ~180 degrees
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
      if (animation && animation.rotation !== undefined) {
        return animation.rotation;
      }
      return 0; // Default facing right
    },

    /**
     * Open Products Dialog (Green Circle Click)
     */
    async openProductsDialog(warehouseName) {
      this.selectedWarehouse = warehouseName
      this.dialogType = 'products'
      this.loadingDetails = true
      this.showInventoryDialog = true
      
      try {
        const response = await axios.get(`/myapp/api/getWarehouseInventoryDetails?warehouse=${warehouseName}`)
        if (response.data.status === 'success') {
          this.selectedWarehouseDetails = response.data
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
      this.selectedWarehouse = warehouseName
      this.dialogType = warehouseName === 'Anbar_Salon_Tolid' ? 'profiles' : 'rawMaterials'
      this.loadingDetails = true
      this.showInventoryDialog = true
      
      try {
        const response = await axios.get(`/myapp/api/getWarehouseInventoryDetails?warehouse=${warehouseName}`)
        if (response.data.status === 'success') {
          this.selectedWarehouseDetails = response.data
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
      this.showCargoDialog = true
      this.loadingCargoDetails = true
      this.selectedShipment = null  // Clear previous data
      
      try {
        const response = await axios.get(`/myapp/api/getShipmentCargoDetails?shipment_id=${shipment.id}`)
        
        if (response.data.status === 'success') {
          this.selectedShipment = response.data.data
        } else {
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
     * Play forklift sound
     */
     playForkliftSound(forkliftId) {
      if (!this.forkliftAudios[forkliftId]) {
        this.forkliftAudios[forkliftId] = new Audio('/static/sounds/forklift-motion.mp3');
        this.forkliftAudios[forkliftId].loop = true;
        this.forkliftAudios[forkliftId].volume = 0.3;

        // Play the audio
        this.forkliftAudios[forkliftId].currentTime = 0;
        this.forkliftAudios[forkliftId].play().catch(err => {
          console.log('Audio play failed for forklift ' + truckId + ':', err);
        });
      }
    },

    /**
     * Stop forklift sound for a specific forklift
     */
    stopForkliftSound(forkliftId) {
      if (this.forkliftAudios[forkliftId]) {
        this.forkliftAudios[forkliftId].pause();
        this.forkliftAudios[forkliftId].currentTime = 0;
      }
    },

    /**
     * Stop all forklift sounds
     */
    stopAllForkliftSounds() {
      Object.keys(this.forkliftAudios).forEach(forkliftId => {
        this.stopForkliftSound(forkliftId);
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

    /**
     * Get forklift waypoints between warehouse and truck
     * Returns array of waypoints for forklift movement
     */
    getForkliftWaypoints(shipment) {
      const unloadLocation = shipment.unload_location;
      const warehousePos = this.forkliftWarehousePositions[unloadLocation];
      const truckStopPos = this.forkliftTruckPositions[unloadLocation];  
      
      if (!warehousePos || !truckStopPos) {
        return { truck: { x: 0, y: 0 }, warehouse: { x: 0, y: 0 }, waypoints: [] };
      }
      
      // Define specific paths for each warehouse to avoid obstacles
      switch(unloadLocation) {
        case 'Anbar_Salon_Tolid':
          return {
            truck: truckStopPos,
            warehouse: warehousePos,
            waypoints: [
              truckStopPos,
              warehousePos              
            ]
          };
        case 'Anbar_Sangin':
          return {
            truck: truckStopPos,
            warehouse: warehousePos,
            waypoints: [
              truckStopPos,
              warehousePos            
            ]
          };
        case 'Anbar_Koochak':
        case 'Anbar_Parvandeh':
          return {
            truck: truckStopPos,
            warehouse: warehousePos,
            waypoints: [
              truckStopPos,
              warehousePos            
            ]
          };
        case 'Anbar_Khamir_Ghadim':
          return {
            truck: truckStopPos,
            warehouse: warehousePos,
            waypoints: [
              truckStopPos,
              warehousePos            
            ]
          };
        case 'Anbar_Khamir_Kordan':
          return {
            truck: truckStopPos,
            warehouse: warehousePos,
            waypoints: [
              truckStopPos,
              warehousePos            
            ]
          };
        case 'Anbar_Muhvateh_Kardan':
          return {
            truck: truckStopPos,
            warehouse: warehousePos,
            waypoints: [
              truckStopPos,
              // { x: warehousePos.x, y: truckStopPos.y },
              // { x: 1030, y: 90 },
              // { x: 1100, y: 90 },
              warehousePos
            ]
          };
        case 'Anbar_PAK':
          return {
            truck: truckStopPos,
            warehouse: warehousePos,
            waypoints: [
              truckStopPos,
              warehousePos            
            ]
          };
        case 'Anbar_Akhal':
          return {
            truck: truckStopPos,
            warehouse: warehousePos,
            waypoints: [
              truckStopPos,
              warehousePos            
            ]
          };
        default:
          return {
            truck: truckStopPos,
            warehouse: warehousePos || truckStopPos,
            waypoints: [truckStopPos, warehousePos || truckStopPos]
          };
      }
    },

    /**
     * Start forklift animation for a shipment
     */
    startForkliftAnimation(shipment) {
      const forkliftId = 'forklift-' + shipment.id;
      const pathData = this.getForkliftWaypoints(shipment);
      const isIncoming = shipment.shipment_type === 'Incoming';
      
      // For Incoming: start at warehouse, go to truck to pick up
      // For Outgoing: start at warehouse to pick up, go to truck to drop
      const waypointsToTruck = [...pathData.waypoints].reverse();
      const waypointsToWarehouse = [...pathData.waypoints]; 
      
      // Use this pattern to update properties:
      if (!this.forkliftAnimations[forkliftId]) {
        this.forkliftAnimations[forkliftId] = {
          currentX: 0,
          currentY: 0,
          hasCargo: false,
          phase: 'toTruck',
          animating: true
        };
      }

      this.forkliftAnimations[forkliftId].currentX = pathData.warehouse.x;
      this.forkliftAnimations[forkliftId].currentY = pathData.warehouse.y;
      this.forkliftAnimations[forkliftId].hasCargo = !isIncoming;
      this.forkliftAnimations[forkliftId].animating = true;

      const duration = 4000; // 4 seconds per segment (slower than truck)
      let currentWaypointIndex = 0;
      let currentPath = waypointsToTruck;
      let phase = 'toTruck';
      
      const animateSegment = () => {
        // Check if shipment is still in LoadingUnloading status
        const currentShipment = this.activeShipments.find(s => s.id === shipment.id);
        if (!currentShipment || currentShipment.status !== 'LoadingUnloading') {
          // Stop animation
          if (this.forkliftAnimations[forkliftId]) {
            this.forkliftAnimations[forkliftId].animating = false;
          }
          this.stopForkliftSound(forkliftId);  
          return;
        }
        
        if (currentWaypointIndex >= currentPath.length - 1) {
          // Reached destination - switch direction
          if (phase === 'toTruck') {
            // Arrived at truck - pick up cargo (Incoming) or drop cargo (Outgoing)
            phase = 'toWarehouse';
            currentPath = waypointsToWarehouse;
            this.forkliftAnimations[forkliftId].hasCargo = isIncoming;
            this.forkliftAnimations[forkliftId].phase = 'toWarehouse';
          } else {
            // Arrived at warehouse - drop cargo (Incoming) or pick up cargo (Outgoing)
            phase = 'toTruck';
            currentPath = waypointsToTruck;
            this.forkliftAnimations[forkliftId].hasCargo = !isIncoming;
            this.forkliftAnimations[forkliftId].phase = 'toTruck';
          }
          currentWaypointIndex = 0;

          this.$nextTick(() => {
            this.forkliftUpdateCounter++;
            this.$forceUpdate();
          });

          // Small pause at destination
          setTimeout(animateSegment, 500);
          return;
        }
        
        const start = currentPath[currentWaypointIndex];
        const end = currentPath[currentWaypointIndex + 1];
        const startTime = Date.now();
        
        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing
          const easeProgress = progress < 0.5 
            ? 2 * progress * progress 
            : -1 + (4 - 2 * progress) * progress;
          
          const currentX = start.x + (end.x - start.x) * easeProgress;
          const currentY = start.y + (end.y - start.y) * easeProgress;
          
          // Update existing object properties instead of replacing
          const anim = this.forkliftAnimations[forkliftId];
          if (anim) {
            anim.currentX = currentX;
            anim.currentY = currentY;
          }
            
          if (progress < 1) {
            this.forkliftAnimationFrames[forkliftId] = requestAnimationFrame(animate);
          } else {
            currentWaypointIndex++;
            setTimeout(animateSegment, 100);
          }
        };
        
        animate();
      };
      
      // Start animation
      animateSegment();
    },

    /**
     * Stop forklift animation
     */
    stopForkliftAnimation(shipmentId) {
      const forkliftId = 'forklift-' + shipmentId;
      if (this.forkliftAnimationFrames[forkliftId]) {
        cancelAnimationFrame(this.forkliftAnimationFrames[forkliftId]);
      }
      if (this.forkliftAnimations[forkliftId]) {
        this.forkliftAnimations[forkliftId].animating = false;
      }
      this.stopForkliftSound(forkliftId);
    },

    /**
     * Get forklift position for rendering
     */
    getForkliftPosition(shipmentId) {
      const forkliftId = 'forklift-' + shipmentId;
      const animation = this.forkliftAnimations[forkliftId];
      if (animation) {
        return { x: animation.currentX, y: animation.currentY };
      }
      return { x: 0, y: 0 };
    },

    /**
     * Check if forklift has cargo
     */
    forkliftHasCargo(shipmentId) {
      const forkliftId = 'forklift-' + shipmentId;
      const animation = this.forkliftAnimations[forkliftId];
      return animation ? animation.hasCargo : false;
    },

    /**
     * Check if a static forklift should be hidden because an animated one is active
     */
     isStaticForkliftHidden(forkliftNumber) {
      // Check if any shipment is in LoadingUnloading with matching unload_location
      const loadingShipments = this.activeShipments.filter(s => s.status === 'LoadingUnloading');
      
      // Check if any warehouse movement is active for this forklift's warehouses
      const activeMovement = this.activeWarehouseMovement;
      
      switch(forkliftNumber) {
        case 1:
          // Forklift 1 - Near Mohavate Homayoun - hides for these warehouses
          const f1Warehouses = ['Anbar_Koochak', 'Anbar_Parvandeh', 'Anbar_Khamir_Ghadim', 'Anbar_Mohavate_Homayoun'];
          if (loadingShipments.some(s => f1Warehouses.includes(s.unload_location))) return true;
          if (activeMovement && (f1Warehouses.includes(activeMovement.from_anbar) || f1Warehouses.includes(activeMovement.to_anbar))) return true;
          return false;
        case 2:
          // Forklift 2 - Near Mohavate Kordan - hides for these warehouses
          const f2Warehouses = ['Anbar_Mohavate_Kardan', 'Anbar_Muhvateh_Kardan', 'Anbar_Khamir_Kordan'];
          if (loadingShipments.some(s => f2Warehouses.includes(s.unload_location))) return true;
          if (activeMovement && (f2Warehouses.includes(activeMovement.from_anbar) || f2Warehouses.includes(activeMovement.to_anbar))) return true;
          return false;
        case 3:
          // Forklift 3 - Near Anbar Salon Tolid - hides for these warehouses
          const f3Warehouses = ['Anbar_Salon_Tolid', 'Anbar_Sangin'];
          if (loadingShipments.some(s => f3Warehouses.includes(s.unload_location))) return true;
          if (activeMovement && (f3Warehouses.includes(activeMovement.from_anbar) || f3Warehouses.includes(activeMovement.to_anbar))) return true;
          return false;
        default:
          return false;
      }
    },

    /**
     * Get the nearest static forklift position to a warehouse
     */
    getStaticForkliftPosition(warehouseName) {
      // Define all static forklift positions
      const staticForklifts = [
        { id: 1, x: 580, y: 95 },   // Forklift 1 - Near Mohavate Homayoun
        { id: 2, x: 1080, y: 35 },  // Forklift 2 - Near Khamir Kordan
        { id: 3, x: 270, y: 255 }   // Forklift 3 - Near Salon Tolid
      ];
      
      // Get the warehouse position
      const warehousePos = this.getWarehouseForkliftPosition(warehouseName);
      
      if (!warehousePos || (warehousePos.x === 0 && warehousePos.y === 0)) {
        // Fallback to forklift 3 if warehouse position not found
        return { x: 270, y: 255 };
      }
      
      // Find the nearest forklift
      let nearestForklift = staticForklifts[0];
      let minDistance = Infinity;
      
      for (const forklift of staticForklifts) {
        const dx = forklift.x - warehousePos.x;
        const dy = forklift.y - warehousePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestForklift = forklift;
        }
      }
      
      return { x: nearestForklift.x, y: nearestForklift.y };
    },

    /**
     * Get the nearest forklift ID (useful for hiding the correct static forklift)
     */
    getNearestForkliftId(warehouseName) {
      const staticForklifts = [
        { id: 1, x: 580, y: 95 },
        { id: 2, x: 1080, y: 35 },
        { id: 3, x: 270, y: 255 }
      ];
      
      const warehousePos = this.getWarehouseForkliftPosition(warehouseName);
      
      if (!warehousePos || (warehousePos.x === 0 && warehousePos.y === 0)) {
        return 3; // Default
      }
      
      let nearestId = 1;
      let minDistance = Infinity;
      
      for (const forklift of staticForklifts) {
        const dx = forklift.x - warehousePos.x;
        const dy = forklift.y - warehousePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestId = forklift.id;
        }
      }
      
      return nearestId;
    },

    /**
     * Get warehouse position for forklift movement
     */
    getWarehouseForkliftPosition(warehouseName) {
      return this.forkliftWarehousePositions[warehouseName] || { x: 0, y: 0 };
    },

    /**
     * Get the path between two warehouses with custom waypoints to avoid obstacles
     */
    getWarehouseToWarehousePath(fromAnbar, toAnbar) {
      const fromPos = this.getWarehouseForkliftPosition(fromAnbar);
      const toPos = this.getWarehouseForkliftPosition(toAnbar);
      
      // Define custom paths for specific warehouse pairs
      const pathKey = `${fromAnbar}_to_${toAnbar}`;
      const reversePathKey = `${toAnbar}_to_${fromAnbar}`;
      
      const customPaths = {
        // Anbar_Salon_Tolid & Anbar_Sangin
        'Anbar_Salon_Tolid_to_Anbar_Sangin': [
          fromPos,
          { x: 500, y: 300 },  // Go down first
          { x: 750, y: 460 },  // Move right
          toPos
        ],
        'Anbar_Sangin_to_Anbar_Salon_Tolid': [
          fromPos,
          { x: 750, y: 460 },
          { x: 500, y: 300 },
          toPos
        ],
        
        // Anbar_Salon_Tolid & Anbar_Khamir_Ghadim
        'Anbar_Salon_Tolid_to_Anbar_Khamir_Ghadim': [
          fromPos,
          { x: 600, y: 320 },  // move right
          { x: 550, y: 60 },   // turn left & move up
          { x: 750, y: 60 },   // turn right & Move right
          toPos
        ],
        'Anbar_Khamir_Ghadim_to_Anbar_Salon_Tolid': [
          fromPos,
          { x: 750, y: 60 },
          { x: 550, y: 60 },
          { x: 600, y: 320 },
          toPos
        ],

        // Anbar_Khamir_Kordan & Anbar_Mohavate_Kordan
        'Anbar_Khamir_Kordan_to_Anbar_Mohavate_Kardan': [
          fromPos,
          { x: 1220, y: 170 },  // Go down first
          { x: 980, y: 100 },  // Move right
          toPos
        ],
        'Anbar_Mohavate_Kardan_to_Anbar_Khamir_Kordan': [
          fromPos,
          { x: 980, y: 100 },
          { x: 1220, y: 170 },
          toPos
        ],
        
        // Anbar_Khamir_Kordan & Anbar_Akhal
        'Anbar_Khamir_Kordan_to_Anbar_Akhal': [
          fromPos,
          { x: 1300, y: 170 },  // move left
          { x: 1100, y: 170 },  // turn left
          { x: 1100, y: 320 },  // move down
          { x: 350, y: 320 },  // turn right
          { x: 350, y: 870 },  // move down
          toPos
        ],
        'Anbar_Akhal_to_Anbar_Khamir_Kordan': [
          fromPos,
          { x: 350, y: 870 },  // move down          
          { x: 350, y: 320 },  // turn right
          { x: 1100, y: 320 },  // move down
          { x: 1100, y: 170 },  // turn left
          { x: 1300, y: 170 },  // move left
          toPos
        ],
        // Add more custom paths here as needed:
        // 'Anbar_Koochak_to_Anbar_Parvandeh': [...],
        // 'Anbar_Khamir_Ghadim_to_Anbar_Mohavath_Homayoun': [...],
      };
      
      // Check for custom path
      if (customPaths[pathKey]) {
        return {
          from: fromPos,
          to: toPos,
          waypoints: customPaths[pathKey]
        };
      }
      
      // Check for reverse path (reverse the waypoints)
      if (customPaths[reversePathKey]) {
        return {
          from: fromPos,
          to: toPos,
          waypoints: [...customPaths[reversePathKey]].reverse()
        };
      }
      
      // Default: direct path (fallback)
      return {
        from: fromPos,
        to: toPos,
        waypoints: [fromPos, toPos]
      };
    },

    /**
     * Process the warehouse movement queue
     */
    processMovementQueue() {
      if (this.processingMovementQueue || this.warehouseMovementQueue.length === 0) {
        return;
      }
      
      this.processingMovementQueue = true;
      const movement = this.warehouseMovementQueue.shift();
      this.startWarehouseMovement(movement);
    },

    /**
     * Start warehouse-to-warehouse forklift movement
     */
    startWarehouseMovement(movement) {
      const movementId = `wh-movement-${Date.now()}`;
      const { from_anbar, to_anbar, quantity } = movement;
      
      console.log(`🚜 Starting warehouse movement: ${from_anbar} → ${to_anbar} (${quantity} trips)`);
      
      this.activeWarehouseMovement = {
        id: movementId,
        from_anbar,
        to_anbar,
        quantity,
        currentTrip: 1
      };
      
      const pathData = this.getWarehouseToWarehousePath(from_anbar, to_anbar);
      
      // Waypoints: static position → source warehouse → destination warehouse → static position
      const sourcePos = pathData.from;
      const destPos = pathData.to;
      
      const staticPosition = this.getStaticForkliftPosition(from_anbar);

      // Initialize at static position
      this.warehouseForkliftAnimations[movementId] = {
        currentX: staticPosition.x,
        currentY: staticPosition.y,
        hasCargo: false,
        animating: true
      };
      
      // Play forklift sound
      this.playForkliftSound(movementId);

      const duration = 6000; // 6 seconds per segment
      let currentTrip = 1;
      let totalTrips = quantity;
      
      // Phases: 'toSource' → 'toDestination' → 'toStatic' (or back to 'toSource' for more trips)
      let phase = 'toSource';
      let currentWaypointIndex = 0;
      
      // Build path based on current phase
      const getPathForPhase = (p) => {
        switch(p) {
          case 'toSource':
            // Simple: Static position → Source warehouse (direct path)
            // No need for complex waypoints - forklift just goes to pick up point
            return [staticPosition, sourcePos];

            // // Path from static position to source warehouse
            // // Use the reverse of the main path, starting from static position
            // const reversePath = [...pathData.waypoints].reverse();
            // // Replace first point (was destPos) with static position
            // reversePath[0] = staticPosition;
            // // Keep only up to sourcePos
            // const sourceIndex = reversePath.findIndex(pt => 
            //   pt.x === sourcePos.x && pt.y === sourcePos.y
            // );
            // if (sourceIndex > 0) {
            //   return reversePath.slice(0, sourceIndex + 1);
            // }
            // return [staticPosition, sourcePos];
            
          case 'toDestination':
            return pathData.waypoints; // Source → Destination (use full custom path)
            
          case 'toStatic':
            // Destination → Static: reverse path, end at static
            const returnPath = [...pathData.waypoints].reverse();
            // returnPath[0] = destPos;  // Ensure we start at dest
            returnPath.push(staticPosition);  // End at static
            return returnPath;
                  
          default:
            return [staticPosition];
        }
      };
      
      let currentPath = getPathForPhase(phase);
      
      const animateSegment = () => {
        // Check if animation was cancelled
        if (!this.warehouseForkliftAnimations[movementId]?.animating) {
          this.stopForkliftSound(movementId);
          this.finishWarehouseMovement(movementId);          
          return;
        }
        
        if (currentWaypointIndex >= currentPath.length - 1) {
          // Reached end of current path
          if (phase === 'toSource') {
            // Arrived at source warehouse - pick up cargo
            console.log(`📦 Trip ${currentTrip}: Picking up cargo from ${from_anbar}`);
            this.warehouseForkliftAnimations[movementId] = {
              ...this.warehouseForkliftAnimations[movementId],
              hasCargo: true
            };
            
            phase = 'toDestination';
            currentPath = getPathForPhase(phase);
            currentWaypointIndex = 0;
            
            setTimeout(animateSegment, 800);
            return;
          } 
          else if (phase === 'toDestination') {
            // Arrived at destination warehouse - drop cargo
            console.log(`📦 Trip ${currentTrip}: Delivered cargo to ${to_anbar}`);
            this.warehouseForkliftAnimations[movementId] = {
              ...this.warehouseForkliftAnimations[movementId],
              hasCargo: false
            };
            
            if (currentTrip >= totalTrips) {
              // All trips done - return to static position
              phase = 'toStatic';
              currentPath = getPathForPhase(phase);
              currentWaypointIndex = 0;
              
              setTimeout(animateSegment, 800);
              return;
            } else {
              // More trips needed - go back to source
              currentTrip++;
              this.activeWarehouseMovement.currentTrip = currentTrip;
              phase = 'toSource';
              currentPath = [destPos, sourcePos]; // Destination → Source
              currentWaypointIndex = 0;
              
              setTimeout(animateSegment, 800);
              return;
            }
          }
          else if (phase === 'toStatic') {
            // Arrived back at static position - animation complete!
            console.log(`✅ All ${totalTrips} trips completed! Forklift returned to static position.`);
            this.finishWarehouseMovement(movementId);
            return;
          }          
        }
        
        const start = currentPath[currentWaypointIndex];
        const end = currentPath[currentWaypointIndex + 1];
        const startTime = Date.now();
        
        const animate = () => {
          if (!this.warehouseForkliftAnimations[movementId]?.animating) {
            this.stopForkliftSound(movementId);
            this.finishWarehouseMovement(movementId);            
            return;
          }
          
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // Easing
          const easeProgress = progress < 0.5 
            ? 2 * progress * progress 
            : -1 + (4 - 2 * progress) * progress;
          
          const currentX = start.x + (end.x - start.x) * easeProgress;
          const currentY = start.y + (end.y - start.y) * easeProgress;

          // Replace entire object to trigger Vue reactivity
          this.warehouseForkliftAnimations[movementId] = {
            ...this.warehouseForkliftAnimations[movementId],
            currentX: currentX,
            currentY: currentY
          };
          
          if (progress < 1) {
            this.warehouseForkliftAnimationFrames[movementId] = requestAnimationFrame(animate);
          } else {
            currentWaypointIndex++;
            setTimeout(animateSegment, 100);
          }
        };
        
        this.warehouseForkliftAnimationFrames[movementId] = requestAnimationFrame(animate);
      };
      
      // Start animation
      animateSegment();
    },

    /**
     * Finish warehouse movement and process next in queue
     */
    finishWarehouseMovement(movementId) {
      // Stop forklift sound
      this.stopForkliftSound(movementId);

      // Cleanup
      if (this.warehouseForkliftAnimationFrames[movementId]) {
        cancelAnimationFrame(this.warehouseForkliftAnimationFrames[movementId]);
        delete this.warehouseForkliftAnimationFrames[movementId];
      }
      delete this.warehouseForkliftAnimations[movementId];
      this.activeWarehouseMovement = null;
      this.processingMovementQueue = false;
      
      this.$forceUpdate();
      
      // Process next movement in queue
      this.$nextTick(() => {
        this.processMovementQueue();
      });
    },

    /**
     * Get current position of warehouse movement forklift
     */
    getWarehouseForkliftAnimPosition() {
      if (this.activeWarehouseMovement) {
        const movementId = this.activeWarehouseMovement.id;
        const anim = this.warehouseForkliftAnimations[movementId];
        if (anim) {
          return { x: anim.currentX, y: anim.currentY };
        }
      }
      return null;
    },

    /**
     * Check if warehouse movement forklift has cargo
     */
    warehouseForkliftHasCargo() {
        if (this.activeWarehouseMovement) {
          const movementId = this.activeWarehouseMovement.id;
          return this.warehouseForkliftAnimations[movementId]?.hasCargo || false;
        }
        return false;
    },

    /**
     * Get warehouse cylinders - one full + one half per width group
     */    
    getWarehouseCylinders(warehouseName) {
      const details = this.warehouseInventoryDetails[warehouseName];
      if (!details || !details.products || !Array.isArray(details.products)) {
        return [];
      }
      
      const config = this.cylinderConfig[warehouseName];
      if (!config) return [];
      
      const cylinders = [];
      let groupIndex = 0;
      
      // For each width group, create max 2 cylinders (1 full + 1 half if remainder)
      details.products.forEach(widthGroup => {
        const { width, count, weight } = widthGroup;
        
        // Calculate quotient and remainder
        const quotient = Math.floor(count / 14);
        const remainder = count % 14;
        const hasHalf = remainder > 0;
        
        // Add gap between groups (5px)
        const groupGap = 5;

        // Calculate position for this group (2 cylinders max per group)
        const groupsPerRow = Math.floor(config.cylindersPerRow / 2); // Each group takes 2 slots
        const row = Math.floor(groupIndex / groupsPerRow);
        const col = groupIndex % groupsPerRow;
        
        if (row >= config.maxRows) return;
        
        // Base X position for this group (spacing * 2 for pair + gap between groups)
        const groupWidth = config.spacingX * 2;  // Width for full + half
        const baseX = config.startX + (col * (groupWidth + groupGap));
        const baseY = config.startY + (row * config.spacingY);
        
        // Full cylinder (only if quotient > 0)
        if (quotient > 0) {
          cylinders.push({
            id: `${warehouseName}-${width}-full`,
            x: baseX,
            y: baseY,
            rx: config.radius.rx,
            ry: config.radius.ry,
            height: config.height,
            isFull: true,
            width: width,
            quotient: quotient,
            reelCount: quotient * 14,
            weight: ((weight / count) * (quotient * 14)).toFixed(2),
            hasHalf: hasHalf,
            groupWidth: hasHalf ? config.spacingX : 0
          });
        }
        
        // Half cylinder for remainder (if exists)
        if (hasHalf) {
          cylinders.push({
            id: `${warehouseName}-${width}-half`,
            x: quotient > 0 ? baseX + config.spacingX : baseX,  // Position at baseX if no full cylinder
            y: baseY,
            rx: config.radius.rx,
            ry: config.radius.ry,
            height: config.height / 2,  // Half height
            isFull: false,
            width: width,
            quotient: 0,
            reelCount: remainder,
            weight: ((weight / count) * remainder).toFixed(2),
            showBracket: quotient === 0  // Show bracket when it's the only cylinder
          });
        }
        
        groupIndex++;
      });
      
      return cylinders;
    },

    /**
     * Get warehouse akhal packs for visualization
     */
    getWarehouseAkhalPacks(warehouseName) {
      const details = this.warehouseInventoryDetails[warehouseName];
      if (!details || !details.akhals || !Array.isArray(details.akhals) || details.akhals.length === 0) {
        return [];
      }
      
      const config = this.akhalPackConfig[warehouseName];
      if (!config) return [];
      
      const packs = [];
      let packIndex = 0;
      const maxPacks = config.packsPerRow * config.maxRows;
      
      // For each akhal kind, create one pack
      details.akhals.forEach(akhalGroup => {
        if (packIndex >= maxPacks) return;
        
        const { kind, weight } = akhalGroup;
        
        const row = Math.floor(packIndex / config.packsPerRow);
        const col = packIndex % config.packsPerRow;
        
        packs.push({
          id: `${warehouseName}-akhal-${kind}`,
          x: config.startX + (col * config.spacingX),
          y: config.startY + (row * config.spacingY),
          kind: kind,
          weight: weight
        });
        
        packIndex++;
      });
      
      return packs;
    },

    /**
     * Determine if forklift should show reel instead of cube
     * @param {string} context - 'shipment' or 'warehouse'
     * @param {Object} data - shipment object or null for warehouse movement
     */
    shouldShowReel(context, data = null) {
      const reelWarehouses = ['Anbar_Salon_Tolid', 'Anbar_Khamir_Ghadim', 'Anbar_Sangin'];
      
      if (context === 'shipment' && data) {
        // Outgoing shipments = loading truck with reels
        return data.shipment_type === 'Outgoing';
      }
      
      if (context === 'warehouse' && this.activeWarehouseMovement) {
        // Check if movement is between reel warehouses
        const fromAnbar = this.activeWarehouseMovement.from_anbar;
        const toAnbar = this.activeWarehouseMovement.to_anbar;
        return reelWarehouses.includes(fromAnbar) || reelWarehouses.includes(toAnbar);
      }
      
      return false;
    },

    /**
     * Show tooltip for cylinder
     */
    showCylinderTooltip(event, cylinder) {
      let content = '';
      if (cylinder.isFull) {
        const totalReels = cylinder.quotient * 14;
        content = `${cylinder.width}mm × ${cylinder.quotient} (${totalReels} reels) - ${cylinder.weight}t`;
      } else {
        content = `${cylinder.width}mm (${cylinder.reelCount} reels) - ${cylinder.weight}t`;
      }
      
      this.tooltip = {
        visible: true,
        content: content,
        x: cylinder.x,
        y: cylinder.y - 25
      };
    },

    /**
     * Show tooltip for Akhal pack
     */
    showAkhalTooltip(event, pack) {
      const content = `${pack.kind} - ${pack.weight}t`;
      
      this.tooltip = {
        visible: true,
        content: content,
        x: pack.x + 20,
        y: pack.y - 10
      };
    },

    /**
     * Hide tooltip
     */
    hideTooltip() {
      this.tooltip.visible = false;
    },

    /**
     * Refresh inventory for a specific warehouse after load/unload
     * @param {string} warehouseName - The warehouse to refresh
     */
    async refreshWarehouseInventory(warehouseName) {
      console.log(`🔄 Refreshing inventory for: ${warehouseName}`)
      
      try {
        let response
        
        // Use different API for Anbar_Salon_Tolid
        if (warehouseName === 'Anbar_Salon_Tolid') {
          response = await axios.get('/myapp/api/getAnbarSalonTolidDetails')
        } else {
          response = await axios.get(`/myapp/api/getWarehouseInventoryDetails?warehouse=${warehouseName}`)
        }
        
        if (response.data.status === 'success') {
          // Update only the specific warehouse in warehouseInventoryDetails
          if (warehouseName === 'Anbar_Salon_Tolid') {
            // Anbar_Salon_Tolid returns its data directly
            this.warehouseInventoryDetails[warehouseName] = response.data.data
          } else {
            // Other warehouses return { warehouse_name: data }
            this.warehouseInventoryDetails[warehouseName] = response.data.data
          }
          
          // Update the simple count for backward compatibility
          const data = this.warehouseInventoryDetails[warehouseName]
          this.warehouseInventory[warehouseName] = data.total_count || 0
          
          console.log(`✅ Inventory refreshed for: ${warehouseName}`)
          
          // Force Vue to update the cylinders/packs
          this.$forceUpdate()
        }
      } catch (error) {
        console.error(`❌ Failed to refresh inventory for ${warehouseName}:`, error)
      }
    },    
  },
  watch: {
    activeShipments: {
      handler(newShipments, oldShipments) {
        
        newShipments.forEach(shipment => {
          // Check if truck status changed or is new
          const oldShipment = oldShipments?.find(s => s.id === shipment.id);
          
          // Trigger animation if: new shipment, status changed, unload_location changed, OR initial load (no oldShipments)
          const unloadLocationChanged = oldShipment && oldShipment.unload_location !== shipment.unload_location;
          if (!oldShipment || oldShipment.status !== shipment.status || unloadLocationChanged || !oldShipments) {           
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
        <text x="800" y="818" text-anchor="middle" font-size="16" font-weight="bold" fill="#fff">STREET</text>
        
        <!-- Anbar Salon Tolid -->
        <g class="anbar-salon-tolid">
          <rect x="40" y="10" width="200" height="430" fill="none" stroke="#000" stroke-width="2" />
          <text x="140" y="430" text-anchor="middle" font-size="12" font-weight="bold">Anbar Salon Tolid</text>
          
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
          
          <!-- Dynamic Cylinders(Reels) in Anbar Salon Tolid -->
          <g v-for="cylinder in getWarehouseCylinders('Anbar_Salon_Tolid')" 
              :key="cylinder.id"
              @mouseenter="showCylinderTooltip($event, cylinder)"
              @mouseleave="hideTooltip"
              style="cursor: pointer;"
          >
            <!-- Group bracket (only for full cylinders) -->
            <g v-if="cylinder.isFull">
              <!-- Title above bracket -->
              <text 
                :x="cylinder.x + (cylinder.hasHalf ? cylinder.groupWidth/2 : 0)" 
                :y="cylinder.y - 14" 
                text-anchor="middle" 
                font-size="6" 
                font-weight="bold"
                fill="#000"
              >{{ cylinder.width }}mm × {{ cylinder.quotient }}</text>
              
              <!-- Bracket shape: ⌐——⌉ -->
              <path 
                :d="`M ${cylinder.x - cylinder.rx - 2},${cylinder.y - 4} 
                    L ${cylinder.x - cylinder.rx - 2},${cylinder.y - 8} 
                    L ${cylinder.x + (cylinder.hasHalf ? cylinder.groupWidth : 0) + cylinder.rx + 2},${cylinder.y - 8} 
                    L ${cylinder.x + (cylinder.hasHalf ? cylinder.groupWidth : 0) + cylinder.rx + 2},${cylinder.y - 4}`"
                fill="none"
                stroke="#666"
                stroke-width="1"
              />
            </g>
            
            <!-- Half cylinder with bracket (when quotient was 0) -->
            <g v-if="!cylinder.isFull && cylinder.showBracket">
              <!-- Bracket shape: ⌐——⌉ -->
              <path 
                :d="`M ${cylinder.x - cylinder.rx - 2},${cylinder.y - 4} 
                    L ${cylinder.x - cylinder.rx - 2},${cylinder.y - 8} 
                    L ${cylinder.x + cylinder.rx + 2},${cylinder.y - 8} 
                    L ${cylinder.x + cylinder.rx + 2},${cylinder.y - 4}`"
                fill="none"
                stroke="#666"
                stroke-width="1"
              />
            </g>

            <!-- Half cylinder title (remainder count) -->
            <text 
              v-if="!cylinder.isFull"
              :x="cylinder.x" 
              :y="cylinder.y - (cylinder.showBracket ? 12 : 4)" 
              text-anchor="middle" 
              font-size="5" 
              fill="#000"
            >({{ cylinder.reelCount }})</text>

            <!-- Bottom ellipse -->
            <ellipse 
              :cx="cylinder.x" 
              :cy="cylinder.y + cylinder.height" 
              :rx="cylinder.rx" 
              :ry="cylinder.ry" 
              fill="#f3dab0" 
              stroke="#000" 
              stroke-width="1.5" 
            />
            <!-- Cylinder body -->
            <path 
              :d="`M ${cylinder.x - cylinder.rx},${cylinder.y + cylinder.height} L ${cylinder.x - cylinder.rx},${cylinder.y} L ${cylinder.x + cylinder.rx},${cylinder.y} L ${cylinder.x + cylinder.rx},${cylinder.y + cylinder.height}`" 
              fill="#f3dab0" 
              stroke="#000" 
              stroke-width="1.5" 
            />
            <!-- Top ellipse -->
            <ellipse 
              :cx="cylinder.x" 
              :cy="cylinder.y" 
              :rx="cylinder.rx" 
              :ry="cylinder.ry" 
              fill="#f3dab0" 
              stroke="#000" 
              stroke-width="1.5" 
            />
            <!-- Weight label on body -->
            <text 
              :x="cylinder.x" 
              :y="cylinder.y + cylinder.height/2 + 2" 
              text-anchor="middle" 
              font-size="5" 
              fill="#000"
            >{{ cylinder.weight }}t</text>
          </g>
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
            <path d="M 0,12 L 35,12 L 35,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="18" y="24" text-anchor="middle" font-size="7" font-weight="bold">Pallet</text>
            <text x="18" y="32" text-anchor="middle" font-size="7" font-weight="bold">A</text>
            <text x="18" y="40" text-anchor="middle" font-size="7" font-weight="bold">22</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 47,5 L 35,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 35,12 L 47,5 L 47,37 L 35,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
        </g>

        <!-- Anbar Khamir Ghadim -->
        <g class="anbar-khamir-ghadim">
          <path d="M 710,69 L 240,69 L 240,10 L 900,10 L 900,69" fill="none" stroke="#000" stroke-width="2" />
          <path d="M 710,69 L 710,140 L 900,140 L 900,69" fill="none" stroke="#000" stroke-width="2" />
          <path d="M 710,140 L 710,180 L 900,180 L 900,140" fill="none" stroke="#000" stroke-width="2" />
          <path d="M 710,180 L 710,223 L 900,223 L 900,180" fill="none" stroke="#000" stroke-width="2" />
          <ellipse cx="485" cy="40" rx="90" ry="25" fill="#fff0d5" stroke="#000" stroke-width="1.5" />
          <text x="500" y="43" text-anchor="middle" font-size="12" font-weight="bold">Anbar Khamir Ghadim</text>
          <text x="800" y="165" text-anchor="middle" font-size="11" font-weight="bold">Water Station</text>
          <text x="800" y="210" text-anchor="middle" font-size="11" font-weight="bold">Gas Station</text>
          
          <rect x="270" y="10" width="100" height="30" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="320" y="30" text-anchor="middle" font-size="11" font-weight="bold">Laboratory</text>
          
          <!-- Dynamic Akhal Packs in Anbar Khamir Ghadim -->
          <g v-for="pack in getWarehouseAkhalPacks('Anbar_Khamir_Ghadim')" 
              :key="pack.id"
              :transform="`translate(${pack.x}, ${pack.y})`"
              @mouseenter="showAkhalTooltip($event, pack)"
              @mouseleave="hideTooltip"
              style="cursor: pointer;"            
          >
            <!-- Front face -->
            <path d="M 0,12 L 35,12 L 35,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="18" y="26" text-anchor="middle" font-size="7" font-weight="bold">{{ pack.kind }}</text>
            <text x="18" y="38" text-anchor="middle" font-size="6">{{ pack.weight }}t</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 47,5 L 35,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 35,12 L 47,5 L 47,37 L 35,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>

          <!-- Dynamic Cylinders(Reels) in Anbar Khamir Ghadim -->
          <g v-for="cylinder in getWarehouseCylinders('Anbar_Khamir_Ghadim')" 
              :key="cylinder.id"
              @mouseenter="showCylinderTooltip($event, cylinder)"
              @mouseleave="hideTooltip"
              style="cursor: pointer;"
          >
            <!-- Group bracket (only for full cylinders) -->
            <g v-if="cylinder.isFull">
              <!-- Title above bracket -->
              <text 
                :x="cylinder.x + (cylinder.hasHalf ? cylinder.groupWidth/2 : 0)" 
                :y="cylinder.y - 14" 
                text-anchor="middle" 
                font-size="6" 
                font-weight="bold"
                fill="#000"
              >{{ cylinder.width }}mm × {{ cylinder.quotient }}</text>
              
              <!-- Bracket shape: ⌐——⌉ -->
              <path 
                :d="`M ${cylinder.x - cylinder.rx - 2},${cylinder.y - 4} 
                    L ${cylinder.x - cylinder.rx - 2},${cylinder.y - 8} 
                    L ${cylinder.x + (cylinder.hasHalf ? cylinder.groupWidth : 0) + cylinder.rx + 2},${cylinder.y - 8} 
                    L ${cylinder.x + (cylinder.hasHalf ? cylinder.groupWidth : 0) + cylinder.rx + 2},${cylinder.y - 4}`"
                fill="none"
                stroke="#666"
                stroke-width="1"
              />
            </g>
            
            <!-- Half cylinder with bracket (when quotient was 0) -->
            <g v-if="!cylinder.isFull && cylinder.showBracket">
              <!-- Bracket shape: ⌐——⌉ -->
              <path 
                :d="`M ${cylinder.x - cylinder.rx - 2},${cylinder.y - 4} 
                    L ${cylinder.x - cylinder.rx - 2},${cylinder.y - 8} 
                    L ${cylinder.x + cylinder.rx + 2},${cylinder.y - 8} 
                    L ${cylinder.x + cylinder.rx + 2},${cylinder.y - 4}`"
                fill="none"
                stroke="#666"
                stroke-width="1"
              />
            </g>

            <!-- Half cylinder title (remainder count) -->
            <text 
              v-if="!cylinder.isFull"
              :x="cylinder.x" 
              :y="cylinder.y - (cylinder.showBracket ? 12 : 4)" 
              text-anchor="middle" 
              font-size="5" 
              fill="#000"
            >({{ cylinder.reelCount }})</text>

            <!-- Bottom ellipse -->
            <ellipse :cx="cylinder.x" :cy="cylinder.y + cylinder.height" :rx="cylinder.rx" :ry="cylinder.ry" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
            <!-- Cylinder body -->
            <path :d="`M ${cylinder.x - cylinder.rx},${cylinder.y + cylinder.height} L ${cylinder.x - cylinder.rx},${cylinder.y} L ${cylinder.x + cylinder.rx},${cylinder.y} L ${cylinder.x + cylinder.rx},${cylinder.y + cylinder.height}`" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
            <!-- Top ellipse -->
            <ellipse :cx="cylinder.x" :cy="cylinder.y" :rx="cylinder.rx" :ry="cylinder.ry" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
            <!-- Weight label on body -->
            <text :x="cylinder.x" :y="cylinder.y + cylinder.height/2 + 2" text-anchor="middle" font-size="5" fill="#000">{{ cylinder.weight }}t</text>
          </g>          
        </g>

        <!-- Anbar Mohavate Homayoun -->
        <!-- Dynamic Akhal Packs in Anbar Mohavate Homayoun -->
        <g v-for="pack in getWarehouseAkhalPacks('Anbar_Mohavate_Homayoun')" 
            :key="pack.id" 
            :transform="`translate(${pack.x}, ${pack.y})`"
            @mouseenter="showAkhalTooltip($event, pack)"
            @mouseleave="hideTooltip"
            style="cursor: pointer;"
        >          
          <!-- Front face -->
          <path d="M 0,12 L 35,12 L 35,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
          <text x="18" y="26" text-anchor="middle" font-size="7" font-weight="bold">{{ pack.kind }}</text>
          <text x="18" y="38" text-anchor="middle" font-size="6">{{ pack.weight }}t</text>
          <!-- Top face -->
          <path d="M 0,12 L 12,5 L 47,5 L 35,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
          <!-- Right side face -->
          <path d="M 35,12 L 47,5 L 47,37 L 35,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
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
          <rect x="710" y="345" width="190" height="55" fill="none" stroke="#000" stroke-width="2" />
          <rect x="710" y="400" width="190" height="210" fill="none" stroke="#000" stroke-width="2" />
          <text x="800" y="380" text-anchor="middle" font-size="12" font-weight="bold">Anbar Abzar</text>
          <text x="800" y="600" text-anchor="middle" font-size="12" font-weight="bold">Anbar Sangin</text>
          
          <!-- Pile of 5 Chemical Sacks (3:5:2 ratio = 30:50:20 pixels) -->
          <g class="chemical-sacks" transform="translate(730, 400)">
            <!-- Bottom Row - 3 Sacks -->
            <!-- Sack 1 (bottom left) -->
            <g transform="translate(33, 40)">
              <rect x="0" y="0" width="20" height="20" rx="3" fill="#f5e6dc" stroke="#5D2906" stroke-width="1.5"/>
              <path d="M 0,0 L 10,-10 L 25,-10 L 20,0 Z" fill="#fabc9f" stroke="#5D2906" stroke-width="1"/>
              <path d="M 20,0 L 25,-10 L 25,15 L 20,20 Z" fill="#a3a19e" stroke="#5D2906" stroke-width="1"/>
              <text x="15" y="28" text-anchor="middle" font-size="6" fill="#fff" font-weight="bold">CHEM</text>
            </g>
            
            <!-- Sack 2 (bottom center) -->
            <g transform="translate(58, 40)">
              <rect x="0" y="0" width="20" height="20" rx="3" fill="#f5e6dc" stroke="#5D2906" stroke-width="1.5"/>
              <path d="M 0,0 L 10,-10 L 25,-10 L 20,0 Z" fill="#fabc9f" stroke="#5D2906" stroke-width="1"/>
              <path d="M 20,0 L 25,-10 L 25,15 L 20,20 Z" fill="#a3a19e" stroke="#5D2906" stroke-width="1"/>
              <text x="15" y="28" text-anchor="middle" font-size="6" fill="#fff" font-weight="bold">CHEM</text>
            </g>
            
            <!-- Sack 3 (bottom right) -->
            <g transform="translate(83, 40)">
              <rect x="0" y="0" width="20" height="20" rx="3" fill="#f5e6dc" stroke="#5D2906" stroke-width="1.5"/>
              <path d="M 0,0 L 10,-10 L 25,-10 L 20,0 Z" fill="#fabc9f" stroke="#5D2906" stroke-width="1"/>
              <path d="M 20,0 L 25,-10 L 25,15 L 20,20 Z" fill="#a3a19e" stroke="#5D2906" stroke-width="1"/>
              <text x="15" y="28" text-anchor="middle" font-size="6" fill="#fff" font-weight="bold">CHEM</text>
            </g>
            
            <!-- Top Row - 2 Sacks (stacked on bottom row) -->
            <!-- Sack 4 (top left) -->
            <g transform="translate(50, 20)">
              <rect x="0" y="0" width="20" height="20" rx="3" fill="#fabc9f" stroke="#5D2906" stroke-width="1.5"/>
              <path d="M 0,0 L 10,-10 L 25,-10 L 20,0 Z" fill="#CD853F" stroke="#5D2906" stroke-width="1"/>
              <path d="M 20,0 L 25,-10 L 25,15 L 20,20 Z" fill="#f5e6dc" stroke="#5D2906" stroke-width="1"/>
              <text x="15" y="28" text-anchor="middle" font-size="6" fill="#fff" font-weight="bold">CHEM</text>
            </g>
            
            <!-- Sack 5 (top right) -->
            <g transform="translate(70, 20)">
              <rect x="0" y="0" width="20" height="20" rx="3" fill="#fabc9f" stroke="#5D2906" stroke-width="1.5"/>
              <path d="M 0,0 L 10,-10 L 25,-10 L 20,0 Z" fill="#CD853F" stroke="#5D2906" stroke-width="1"/>
              <path d="M 20,0 L 25,-10 L 25,15 L 20,20 Z" fill="#f5e6dc" stroke="#5D2906" stroke-width="1"/>
              <text x="15" y="28" text-anchor="middle" font-size="6" fill="#fff" font-weight="bold">CHEM</text>
            </g>
          </g>

          <!-- Dynamic Cylinders(Reels) in Anbar Sangin -->
          <g v-for="cylinder in getWarehouseCylinders('Anbar_Sangin')" 
              :key="cylinder.id"
              @mouseenter="showCylinderTooltip($event, cylinder)"
              @mouseleave="hideTooltip"
              style="cursor: pointer;"
          >
            <!-- Group bracket (only for full cylinders) -->
            <g v-if="cylinder.isFull">
              <!-- Title above bracket -->
              <text 
                :x="cylinder.x + (cylinder.hasHalf ? cylinder.groupWidth/2 : 0)" 
                :y="cylinder.y - 14" 
                text-anchor="middle" 
                font-size="6" 
                font-weight="bold"
                fill="#000"
              >{{ cylinder.width }}mm × {{ cylinder.quotient }}</text>
              
              <!-- Bracket shape: ⌐——⌉ -->
              <path 
                :d="`M ${cylinder.x - cylinder.rx - 2},${cylinder.y - 4} 
                    L ${cylinder.x - cylinder.rx - 2},${cylinder.y - 8} 
                    L ${cylinder.x + (cylinder.hasHalf ? cylinder.groupWidth : 0) + cylinder.rx + 2},${cylinder.y - 8} 
                    L ${cylinder.x + (cylinder.hasHalf ? cylinder.groupWidth : 0) + cylinder.rx + 2},${cylinder.y - 4}`"
                fill="none"
                stroke="#666"
                stroke-width="1"
              />
            </g>
                        
            <!-- Half cylinder with bracket (when quotient was 0) -->
            <g v-if="!cylinder.isFull && cylinder.showBracket">
              <!-- Bracket shape: ⌐——⌉ -->
              <path 
                :d="`M ${cylinder.x - cylinder.rx - 2},${cylinder.y - 4} 
                    L ${cylinder.x - cylinder.rx - 2},${cylinder.y - 8} 
                    L ${cylinder.x + cylinder.rx + 2},${cylinder.y - 8} 
                    L ${cylinder.x + cylinder.rx + 2},${cylinder.y - 4}`"
                fill="none"
                stroke="#666"
                stroke-width="1"
              />
            </g>

            <!-- Half cylinder title (remainder count) -->
            <text 
              v-if="!cylinder.isFull"
              :x="cylinder.x" 
              :y="cylinder.y - (cylinder.showBracket ? 12 : 4)" 
              text-anchor="middle" 
              font-size="5" 
              fill="#000"
            >({{ cylinder.reelCount }})</text>
                        
            <!-- Bottom ellipse -->
            <ellipse :cx="cylinder.x" :cy="cylinder.y + cylinder.height" :rx="cylinder.rx" :ry="cylinder.ry" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
            <!-- Cylinder body -->
            <path :d="`M ${cylinder.x - cylinder.rx},${cylinder.y + cylinder.height} L ${cylinder.x - cylinder.rx},${cylinder.y} L ${cylinder.x + cylinder.rx},${cylinder.y} L ${cylinder.x + cylinder.rx},${cylinder.y + cylinder.height}`" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
            <!-- Top ellipse -->
            <ellipse :cx="cylinder.x" :cy="cylinder.y" :rx="cylinder.rx" :ry="cylinder.ry" fill="#f3dab0" stroke="#000" stroke-width="1.5" />
            <!-- Weight label on body -->
            <text :x="cylinder.x" :y="cylinder.y + cylinder.height/2 + 2" text-anchor="middle" font-size="5" fill="#000">{{ cylinder.weight }}t</text>
          </g>
        </g>

        <!-- QC Area (moved left with gap from right narrow green oval) -->
        <g class="qc-area">
          <rect x="710" y="610" width="190" height="110" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="800" y="670" text-anchor="middle" font-size="13" font-weight="bold">QC</text>
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
        <!-- Dynamic Akhal Packs in Anbar Mohavate Kardan -->
        <g v-for="pack in getWarehouseAkhalPacks('Anbar_Mohavate_Kardan')" 
            :key="pack.id" 
            :transform="`translate(${pack.x}, ${pack.y})`"
            @mouseenter="showAkhalTooltip($event, pack)"
            @mouseleave="hideTooltip"
            style="cursor: pointer;"
        >          
          <!-- Front face -->
          <path d="M 0,12 L 35,12 L 35,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
          <text x="18" y="26" text-anchor="middle" font-size="7" font-weight="bold">{{ pack.kind }}</text>
          <text x="18" y="38" text-anchor="middle" font-size="6">{{ pack.weight }}t</text>
          <!-- Top face -->
          <path d="M 0,12 L 12,5 L 47,5 L 35,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
          <!-- Right side face -->
          <path d="M 35,12 L 47,5 L 47,37 L 35,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
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
          
          <!-- Dynamic Akhal Packs in Anbar Khamir Kordan -->
          <g v-for="pack in getWarehouseAkhalPacks('Anbar_Khamir_Kordan')" 
              :key="pack.id" 
              :transform="`translate(${pack.x}, ${pack.y})`"
              @mouseenter="showAkhalTooltip($event, pack)"
              @mouseleave="hideTooltip"
              style="cursor: pointer;"
          >
            <!-- Front face -->
            <path d="M 0,12 L 35,12 L 35,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="18" y="26" text-anchor="middle" font-size="7" font-weight="bold">{{ pack.kind }}</text>
            <text x="18" y="38" text-anchor="middle" font-size="6">{{ pack.weight }}t</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 47,5 L 35,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 35,12 L 47,5 L 47,37 L 35,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
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
          <rect x="1170" y="670" width="100" height="80" fill="#fff" stroke="#000" stroke-width="2" />
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
        
          <!-- Dynamic Akhal Packs in Anbar PAK -->
          <g v-for="pack in getWarehouseAkhalPacks('Anbar_PAK')" 
              :key="pack.id"
              :transform="`translate(${pack.x}, ${pack.y})`"
              @mouseenter="showAkhalTooltip($event, pack)"
              @mouseleave="hideTooltip"
              style="cursor: pointer;"            
          >            
          <!-- Front face -->
            <path d="M 0,12 L 35,12 L 35,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="18" y="26" text-anchor="middle" font-size="7" font-weight="bold">{{ pack.kind }}</text>
            <text x="18" y="38" text-anchor="middle" font-size="6">{{ pack.weight }}t</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 47,5 L 35,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 35,12 L 47,5 L 47,37 L 35,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>        
        </g>

        <!-- Anbar Akhal -->
        <g class="anbar-akhal-bottom">
          <rect x="40" y="843" width="320" height="125" fill="none" stroke="#000" stroke-width="2" />
          <text x="200" y="860" text-anchor="middle" font-size="12" font-weight="bold">Anbar Akhal</text>          

          <!-- Dynamic Akhal Packs in Anbar Akhal -->
          <g v-for="pack in getWarehouseAkhalPacks('Anbar_Akhal')" 
              :key="pack.id"
              :transform="`translate(${pack.x}, ${pack.y})`"
              @mouseenter="showAkhalTooltip($event, pack)"
              @mouseleave="hideTooltip"
              style="cursor: pointer;"            
          >            
          <!-- Front face -->
            <path d="M 0,12 L 35,12 L 35,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="18" y="26" text-anchor="middle" font-size="7" font-weight="bold">{{ pack.kind }}</text>
            <text x="18" y="38" text-anchor="middle" font-size="6">{{ pack.weight }}t</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 47,5 L 35,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 35,12 L 47,5 L 47,37 L 35,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
        </g>

        <!-- Entrances (repositioned) -->
        <g class="entrances">
          <!-- Left entrance - under Weight Station 1 -->
          <rect x="290" y="760" width="120" height="42" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="350" y="785" text-anchor="middle" font-size="12">Entrance</text>
          
          <!-- Right entrance - moved to right -->
          <rect x="1010" y="760" width="120" height="42" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="1070" y="785" text-anchor="middle" font-size="12">Entrance</text>
        </g>

        <!-- STATIC FORKLIFTS (Always Visible - Ready State - BIGGER) -->
        <g class="static-forklifts">
          <!-- Forklift 1 - Near Mohavate Homayoun -->
          <g v-if="!isStaticForkliftHidden(1)" transform="translate(580, 95)">
            <text x="0" y="0" font-size="30" text-anchor="middle">🚜</text>
            <circle cx="-12" cy="-13" r="5" fill="#4caf50" stroke="#fff" stroke-width="2" />
            <text x="0" y="20" text-anchor="middle" font-size="8" fill="#4caf50" font-weight="bold">READY</text>
          </g>
          
          <!-- Forklift 2 - Near Mohavate Kordan -->
          <g v-if="!isStaticForkliftHidden(2)" transform="translate(1080, 35)">
            <text x="0" y="0" font-size="30" text-anchor="middle">🚜</text>
            <circle cx="-12" cy="-13" r="5" fill="#4caf50" stroke="#fff" stroke-width="2" />
            <text x="0" y="20" text-anchor="middle" font-size="8" fill="#4caf50" font-weight="bold">READY</text>
          </g>
          
          <!-- Forklift 3 - Near Anbar Salon Tolid -->
          <g v-if="!isStaticForkliftHidden(3)" transform="translate(270, 255)">
            <text x="0" y="0" font-size="30" text-anchor="middle">🚜</text>
            <circle cx="-12" cy="-13" r="5" fill="#4caf50" stroke="#fff" stroke-width="2" />
            <text x="0" y="20" text-anchor="middle" font-size="8" fill="#4caf50" font-weight="bold">READY</text>
          </g>
        </g>

        <!-- Animated Warehouse-to-Warehouse Forklift -->
        <g 
          v-if="activeWarehouseMovement && getWarehouseForkliftAnimPosition()"
          :transform="`translate(${getWarehouseForkliftAnimPosition().x}, ${getWarehouseForkliftAnimPosition().y})`"
          class="warehouse-forklift-animated"
        >
          <!-- Forklift Emoji -->
          <text x="0" y="0" font-size="30" text-anchor="middle">🚜</text>

          <!-- Cargo - Reel or Box depending on warehouse type -->
          <g v-show="warehouseForkliftHasCargo()">
            <!-- Reel (cylinder) for reel warehouse movements -->
            <g v-if="shouldShowReel('warehouse')" transform="translate(12, -8)">
              <!-- Bottom ellipse -->
              <ellipse cx="10" cy="6" rx="5" ry="2" fill="#f3dab0" stroke="#000" stroke-width="1" />
              <!-- Cylinder body -->
              <rect x="5" y="-10" width="10" height="16" fill="#f3dab0" stroke="none" />
              <line x1="5" y1="-10" x2="5" y2="6" stroke="#000" stroke-width="1" />
              <line x1="15" y1="-10" x2="15" y2="6" stroke="#000" stroke-width="1" />
              <!-- Top ellipse -->
              <ellipse cx="10" cy="-10" rx="5" ry="2" fill="#f3dab0" stroke="#000" stroke-width="1" />
              <line x1="5" y1="8" x2="20" y2="8" stroke="#000" stroke-width="3" />
            </g>
            <!-- Box (cube) for other warehouse movements -->
            <text v-else x="20" y="5" font-size="20" text-anchor="middle">📦</text>
          </g>
                    
          <!-- Trip counter badge -->
          <circle cx="-12" cy="-13" r="8" fill="#2196f3" stroke="#fff" stroke-width="2" />
          <text x="-12" y="-10" text-anchor="middle" font-size="8" fill="#fff" font-weight="bold">
            {{ activeWarehouseMovement.currentTrip }}/{{ activeWarehouseMovement.quantity }}
          </text>
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
            <circle cx="0" cy="0" r="15" fill="#4CAF50" stroke="#fff" stroke-width="2.5" opacity="0.95" />
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
            <circle cx="30" cy="0" r="15" fill="#FF9800" stroke="#fff" stroke-width="2.5" opacity="0.95" />
            <text 
              x="30" 
              y="-3" 
              text-anchor="middle" 
              font-size="10" 
              font-weight="bold" 
              fill="#fff"
            >
              {{ formatWeight(getWarehouseRawMaterialsWeight(warehouse)) }}
            </text>
            <text 
              x="30" 
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
            <!-- Professional 3D Flatbed Truck (REVERSED - Cab at back, trailer at front) --> -63, -49
            <g :transform="`translate(${(truckAnimations[shipment.id]?.flipX || 1) * -120.4}, -43.75) scale(${(truckAnimations[shipment.id]?.flipX || 1) * 0.7}, 0.7)`">
              <g :transform="`rotate(${getAnimatedTruckRotation(shipment)}, 172, 62.5)`">                <g v-if="shipment.status === 'Registered' || shipment.status === 'LoadedUnloaded'" class="motion-trail" opacity="0.4">
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
        </g>

        <!-- Active Forklifts (Dynamic - Animated between truck and warehouse) -->
        <g class="active-forklifts">
          <template v-for="shipment in activeShipments" :key="'forklift-' + shipment.id">
            <g v-if="shipment.status === 'LoadingUnloading' && shipment.unload_location && forkliftAnimations['forklift-' + shipment.id]">
              <g 
                :transform="`translate(${getForkliftPosition(shipment.id).x}, ${getForkliftPosition(shipment.id).y})`"
                class="forklift-animated"
                :key="'fl-' + shipment.id"
              >
                <!-- Forklift Emoji Icon -->
                <text 
                  x="0" 
                  y="0" 
                  font-size="30" 
                  text-anchor="middle"
                >🚜</text>

                <!-- Cargo - Reel or Box depending on cargo type -->
                <g v-show="forkliftAnimations['forklift-' + shipment.id]?.hasCargo"
                  :key="'cargo-' + shipment.id + '-' + forkliftUpdateCounter">
                  <!-- Reel (cylinder) for outgoing shipments -->
                  <g v-if="shouldShowReel('shipment', shipment)" transform="translate(12, -8)">
                    <!-- Bottom ellipse -->
                    <ellipse cx="10" cy="6" rx="5" ry="2" fill="#f3dab0" stroke="#000" stroke-width="1" />
                    <!-- Cylinder body -->
                    <rect x="5" y="-10" width="10" height="16" fill="#f3dab0" stroke="none" />
                    <line x1="5" y1="-10" x2="5" y2="6" stroke="#000" stroke-width="1" />
                    <line x1="15" y1="-10" x2="15" y2="6" stroke="#000" stroke-width="1" />
                    <!-- Top ellipse -->
                    <ellipse cx="10" cy="-10" rx="5" ry="2" fill="#f3dab0" stroke="#000" stroke-width="1" />
                    <line x1="5" y1="8" x2="20" y2="8" stroke="#000" stroke-width="3" />
                  </g>
                  <!-- Box (cube) for incoming shipments -->
                  <text v-else x="20" y="5" font-size="20" text-anchor="middle">📦</text>
                </g>
                
                <!-- Blinking WORKING indicator -->
                <circle cx="-15" cy="-18" r="6" fill="#ff5722" class="blink-animation" stroke="#fff" stroke-width="2" />
                
                <!-- Direction indicator -->
                <text 
                  x="0" 
                  y="25" 
                  text-anchor="middle" 
                  font-size="8" 
                  font-weight="bold" 
                  fill="#ff9800"
                >
                  {{ forkliftAnimations['forklift-' + shipment.id]?.phase === 'toTruck' ? '→ TRUCK' : '→ WAREHOUSE' }}
                </text>
                
                <!-- Tooltip -->
                <title>Forklift {{ forkliftHasCargo(shipment.id) ? '(Carrying cargo)' : '(Empty)' }}
        Truck: {{ shipment.license_number }}
        {{ shipment.shipment_type === 'Incoming' ? 'Unloading from truck' : 'Loading to truck' }}
        Destination: {{ shipment.unload_location }}</title>
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

        <!-- Custom Tooltip -->
        <g v-if="tooltip.visible" 
          class="custom-tooltip"
          :transform="`translate(${tooltip.x}, ${tooltip.y})`">
          <!-- Tooltip background -->
          <rect 
            :x="-(tooltip.content.length * 4.5 + 16) / 2" 
            y="-18" 
            :width="tooltip.content.length * 4.5 + 16"             
            height="22" 
            rx="4" 
            ry="4"
            fill="#333"
            fill-opacity="0.9"
            stroke="#555"
            stroke-width="1"
          />
          <!-- Tooltip arrow -->
          <polygon points="-5,4 5,4 0,10" fill="#333" />
          <!-- Tooltip text -->
          <text 
            x="0" 
            y="-3" 
            font-size="9" 
            fill="#fff"
            font-family="Tahoma, Arial, sans-serif"
            text-anchor="middle"
          >{{ tooltip.content }}</text>
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
  r: 15;
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

/* Custom Tooltip Styles */
.custom-tooltip {
  pointer-events: none;
  z-index: 1000;
}

.custom-tooltip text {
  font-weight: 500;
  text-shadow: none;
}
</style>

