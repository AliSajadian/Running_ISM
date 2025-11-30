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
      pollingInterval: null,
      lastUpdateTime: null,
      // Location coordinates mapping (matching SVG positions)
      locationCoordinates: {
        'Entrance': { x: 320, y: 760 },  // Left entrance - moved under W1
        'Weight_Station_1': { x: 320, y: 580 },  // Moved up vertically
        'Weight_Station_2': { x: 1140, y: 410 },
        'Exit': { x: 1070, y: 760 },  // Right entrance - moved to right
        'Anbar_PAK': { x: 1410, y: 620 },
        'Anbar_Khamir_Kordan': { x: 1275, y: 330 },
        'Anbar_Khamir_Ghadim': { x: 805, y: 150 },
        'Anbar_Parvandeh': { x: 335, y: 94 },
        'Anbar_Koochak': { x: 335, y: 170 },
        'Anbar_Sangin': { x: 845, y: 425 },
        'Anbar_Salon_Tolid': { x: 140, y: 237 },
        'Anbar_Akhal': { x: 200, y: 905 },
        'Loading_Unloading': { x: 510, y: 610 },
        'Office': { x: 1224, y: 724 },
        'QC': { x: 845, y: 580 },
      },
      truckStopPositions: {
        'Entrance': { x: 320, y: 760 },  // Left entrance - moved under W1
        'Weight_Station_1': { x: 320, y: 610 },
        'Anbar_Salon_Tolid': { x: 320, y: 237 },
        'Anbar_Akhal': { x: 200, y: 870 },
        'Anbar_PAK': { x: 1410, y: 620 },
        'Anbar_Khamir_Kordan': { x: 1275, y: 330 },
        'Anbar_Khamir_Ghadim': { x: 805, y: 150 },
        'Anbar_Parvandeh': { x: 335, y: 94 },
        'Anbar_Koochak': { x: 335, y: 170 },
        'Anbar_Sangin': { x: 820, y: 425 },
        'Anbar_Salon_Tolid': { x: 140, y: 237 },
        'Anbar_Akhal': { x: 200, y: 905 },
        'Loading_Unloading': { x: 510, y: 610 },
        'Weight_Station_2': { x: 1140, y: 410 },
        'Office': { x: 1224, y: 724 },
      },
      // Warehouse badge positions
      warehouseBadgePositions: {
        'Anbar_PAK': { x: 1410, y: 470 },
        'Anbar_Sangin': { x: 845, y: 350 },
        'Anbar_Khamir_Kordan': { x: 1275, y: 25 },
        'Anbar_Khamir_Ghadim': { x: 805, y: 75 },
        'Anbar_Parvandeh': { x: 335, y: 75 },
        'Anbar_Koochak': { x: 335, y: 125 },
        'Anbar_Salon_Tolid': { x: 140, y: 20 },
        'Anbar_Akhal': { x: 200, y: 870 },
      }
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
  },
  beforeUnmount() {
    console.log('FactoryMap component unmounting')
    this.stopPolling()
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
          this.warehouseInventory = response.data.data
          console.log('Loaded warehouse inventory:', this.warehouseInventory)
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
      
      // Determine START position based on workflow:
      
      // Registered → START at Entrance
      if (status === 'Registered') {
        return this.truckStopPositions['Entrance'] || { x: 480, y: 775 }
      }
      
      // LoadingUnloading → Already at warehouse from previous step
      if (status === 'LoadingUnloading') {
        return this.truckStopPositions['Weight_Station_1'] || { x: 320, y: 610 }
      }
      
      // LoadedUnloaded → START at warehouse (where it was loading)
      if (status === 'LoadedUnloaded') {
        if (type === 'Incoming' && unloadLocation) {
          return this.truckStopPositions[unloadLocation] || this.truckStopPositions['Loading_Unloading']
        } else if (type === 'Outgoing') {
          return this.truckStopPositions['Anbar_Salon_Tolid'] || { x: 320, y: 237 }
        }
        return this.truckStopPositions['Weight_Station_1'] || { x: 320, y: 610 }
      }
      
      // Office → START at Weight Station 2
      if (status === 'Office') {
        return this.truckStopPositions['Weight_Station_2'] || { x: 1140, y: 410 }
      }
      
      // Delivered → START at Office
      if (status === 'Delivered') {
        return this.truckStopPositions['Office'] || { x: 1224, y: 724 }
      }
      
      // Default
      return this.truckStopPositions['Entrance'] || { x: 480, y: 775 }
    },
    
    /**
     * Get truck END position (where truck should stop and wait)
     */
    getTruckEndPosition(shipment) {
      const status = shipment.status
      const type = shipment.shipment_type
      const location = shipment.location
      const unloadLocation = shipment.unload_location
      
      // Determine END position based on workflow:
      
      // 1. Registered → END at Weight Station 1 (stops and waits)
      if (status === 'Registered') {
        return this.truckStopPositions['Weight_Station_1'] || { x: 320, y: 610 }
      }
      
      // 2. LoadingUnloading → END at warehouse (stops for loading)
      if (status === 'LoadingUnloading') {
        if (type === 'Incoming' && unloadLocation) {
          return this.truckStopPositions[unloadLocation] || this.truckStopPositions['Loading_Unloading']
        } else if (type === 'Outgoing') {
          return this.truckStopPositions['Anbar_Salon_Tolid'] || { x: 320, y: 237 }
        }
        return this.truckStopPositions['Loading_Unloading'] || { x: 510, y: 610 }
      }
      
      // 3. LoadedUnloaded → END at Weight Station 2 (stops and waits)
      if (status === 'LoadedUnloaded') {
        return this.truckStopPositions['Weight_Station_2'] || { x: 1140, y: 410 }
      }
      
      // 4. Office → END at Office
      if (status === 'Office') {
        return this.truckStopPositions['Office'] || { x: 1224, y: 724 }
      }
      
      // 5. Delivered → END at street (exits)
      if (status === 'Delivered') {
        return { x: 100, y: 820 }
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
          return 90
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
     * Get warehouse inventory count
     */
    getWarehouseCount(warehouseName) {
      return this.warehouseInventory[warehouseName] || 0
    },

    /**
     * Format warehouse display name
     */
    formatWarehouseName(name) {
      return name.replace('Anbar_', '').replace(/_/g, ' ')
    },
  },
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
        <rect x="0" y="783" width="1700" height="60" fill="#666" stroke="#666" stroke-width="2" />
        <text x="850" y="818" text-anchor="middle" font-size="16" font-weight="bold" fill="#fff">STREET</text>
        
        <!-- Anbar Salon Tolid (moved up 10px) -->
        <g class="anbar-salon-tolid">
          <rect x="40" y="10" width="200" height="455" fill="none" stroke="#000" stroke-width="2" />
          <text x="140" y="455" text-anchor="middle" font-size="13" font-weight="bold">Anbar Salon Tolid</text>
          
          <!-- PM3 Area (increased width, equal gaps on sides and between) -->
          <rect x="50" y="15" width="63" height="230" fill="#f5f5f5" stroke="#000" stroke-width="2" />
          <!-- Top empty square -->
          <rect x="55" y="20" width="53" height="53" fill="#fff" stroke="#000" stroke-width="1.5" />
          <!-- Bottom empty square -->
          <rect x="55" y="187" width="53" height="53" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="81" y="140" text-anchor="middle" font-size="12" font-weight="bold">PM3</text>
          
          <!-- PM2 Area (30% narrower: 63 * 0.7 = 44) -->
          <rect x="137" y="15" width="44" height="140" fill="#f5f5f5" stroke="#000" stroke-width="2" />
          <!-- Top empty square -->
          <rect x="141" y="20" width="36" height="36" fill="#fff" stroke="#000" stroke-width="1.5" />
          <!-- Bottom empty square -->
          <rect x="141" y="109" width="36" height="36" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="159" y="90" text-anchor="middle" font-size="12" font-weight="bold">PM2</text>
          
          <!-- Cylinders in Anbar Salon Tolid (2 rows, 3 cylinders, moved up with gap above text, all surfaces white) -->
          <!-- Row 1 -->
          <ellipse cx="70" cy="320" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="50" y="320" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="70" cy="365" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="120" cy="320" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="100" y="320" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="120" cy="365" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="170" cy="320" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="150" y="320" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="170" cy="365" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          
          <!-- Row 2 -->
          <ellipse cx="70" cy="380" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="50" y="380" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="70" cy="425" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="120" cy="380" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="100" y="380" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="120" cy="425" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          
          <ellipse cx="170" cy="380" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="150" y="380" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="170" cy="425" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
        </g>

        <!-- Empty rect between Anbar Salon Tolid and upper right narrow green oval (moved up 10px) -->
        <rect x="240" y="10" width="660" height="59" fill="none" stroke="#000" stroke-width="2" />

        <!-- Anbar Parvandeh (moved up 10px) -->
        <g class="anbar-parvandeh">
          <rect x="240" y="69" width="190" height="50" fill="none" stroke="#000" stroke-width="2" />
          <text x="335" y="98" text-anchor="middle" font-size="11" font-weight="bold">Anbar Parvandeh</text>
        </g>

        <!-- Anbar Koochak (moved up 10px) -->
        <g class="anbar-koochak">
          <rect x="240" y="119" width="190" height="102" fill="none" stroke="#000" stroke-width="2" />
          <text x="335" y="210" text-anchor="middle" font-size="11" font-weight="bold">Anbar Koochak</text>
          
          <!-- Pallet A 22 cube -->
          <g transform="translate(305, 135)">
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

        <!-- Anbar Khamir Ghadim (moved up 10px) -->
        <g class="anbar-khamir-ghadim">
          <rect x="710" y="69" width="190" height="154" fill="none" stroke="#000" stroke-width="2" />
          <text x="805" y="210" text-anchor="middle" font-size="11" font-weight="bold">Anbar Khamir Ghadim</text>
          
          <!-- Pallet B 12 cube -->
          <g transform="translate(725, 85)">
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
          <g transform="translate(810, 85)">
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
        </g>

        <!-- Weight Station 1 (Moved upward) -->
        <g class="weight-station-1">
          <rect x="290" y="490" width="60" height="180" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="320" y="565" text-anchor="middle" font-size="11" font-weight="bold">Weight</text>
          <text x="320" y="585" text-anchor="middle" font-size="11" font-weight="bold">Station</text>
          <text x="320" y="605" text-anchor="middle" font-size="11" font-weight="bold">1</text>
        </g>

        <!-- Anbar Sangin (moved left with gap from right narrow green oval) -->
        <g class="anbar-sangin">
          <rect x="790" y="345" width="110" height="160" fill="none" stroke="#000" stroke-width="2" />
          <text x="845" y="490" text-anchor="middle" font-size="13" font-weight="bold">Anbar Sangin</text>
          
          <!-- PM2 Cylinders in Sangin (2 rows, 2 cylinders each, with data labels) -->
          <!-- Row 1 Left: PM2, 140, 12 -->
          <ellipse cx="820" cy="360" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="800" y="360" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="820" cy="405" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="820" y="378" text-anchor="middle" font-size="7">PM2</text>
          <text x="820" y="388" text-anchor="middle" font-size="7">140</text>
          <text x="820" y="398" text-anchor="middle" font-size="7">12</text>
          
          <!-- Row 1 Right: PM2, 140, 13 -->
          <ellipse cx="860" cy="360" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="840" y="360" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="860" cy="405" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="860" y="378" text-anchor="middle" font-size="7">PM2</text>
          <text x="860" y="388" text-anchor="middle" font-size="7">140</text>
          <text x="860" y="398" text-anchor="middle" font-size="7">13</text>
          
          <!-- Row 2 Left: PM2, 130, 22 -->
          <ellipse cx="820" cy="420" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="800" y="420" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="820" cy="465" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="820" y="438" text-anchor="middle" font-size="7">PM2</text>
          <text x="820" y="448" text-anchor="middle" font-size="7">130</text>
          <text x="820" y="458" text-anchor="middle" font-size="7">22</text>
          
          <!-- Row 2 Right: PM2, 120, 13 -->
          <ellipse cx="860" cy="420" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <rect x="840" y="420" width="40" height="45" fill="#fff" stroke="#000" stroke-width="1.5" />
          <ellipse cx="860" cy="465" rx="20" ry="8" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="860" y="438" text-anchor="middle" font-size="7">PM2</text>
          <text x="860" y="448" text-anchor="middle" font-size="7">120</text>
          <text x="860" y="458" text-anchor="middle" font-size="7">13</text>
        </g>

        <!-- QC Area (moved left with gap from right narrow green oval) -->
        <g class="qc-area">
          <rect x="790" y="525" width="110" height="110" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="845" y="585" text-anchor="middle" font-size="13" font-weight="bold">QC</text>
        </g>

        <!-- Narrow Green Ovals (Roads) - Narrower, half height from top -->
        <g class="roads">
          <!-- First vertical divider (left, narrower, moved down a bit) -->
          <ellipse cx="480" cy="520" rx="8" ry="175" fill="#c8e6c9" stroke="#4caf50" stroke-width="2" />
          <!-- Second vertical divider (right-center, narrower, moved down a bit) -->
          <ellipse cx="950" cy="520" rx="8" ry="175" fill="#c8e6c9" stroke="#4caf50" stroke-width="2" />
          <!-- Third divider (right upper, height increased by 1/3: 87.5 * 1.333 = 116.7, extended from bottom) -->
          <ellipse cx="950" cy="136.7" rx="8" ry="116.7" fill="#c8e6c9" stroke="#4caf50" stroke-width="2" />
        </g>
        
        <!-- Workflow Path (CLEAN - NO ARROWS - AVOIDING ALL BUILDINGS) -->
        <g class="workflow-path">
          <!-- GREEN Path (Incoming): Entrance → W1 → Above/Below left tree → Warehouses → W2 → Exit -->
          <g stroke="#4caf50" stroke-width="4" stroke-dasharray="12,8" opacity="0.5" fill="none" class="path-animation">
            <!-- From entrance up to Weight Station 1 -->
            <line x1="320" y1="760" x2="320" y2="670" />
            <line x1="320" y1="670" x2="320" y2="580" />
            
            <!-- Continue up after W1, with distance from top of left tree (y=345-20=325) -->
            <line x1="320" y1="580" x2="320" y2="260" />
            
            <!-- Turn right ABOVE left tree (20px gap from top at y=345) -->
            <line x1="320" y1="260" x2="750" y2="260" />
                       
            <!-- Path to Anbar Sangin -->
            <line x1="750" y1="260" x2="750" y2="425" />
            
            <!-- After Anbar Sangin, continue down to turn BELOW left tree (y=695+20=715) -->
            <line x1="750" y1="425" x2="750" y2="715" />
            
            <!-- Turn right BELOW left tree (20px gap from bottom at y=695) -->
            <line x1="750" y1="715" x2="460" y2="715" />
            
            <!-- Turn right to avoid tree and return to main path -->
            <line x1="460" y1="715" x2="320" y2="715" />
            <line x1="320" y1="715" x2="320" y2="760" />
            
            <!-- Alternative path to W2 (from warehouses area) -->
            <line x1="650" y1="260" x2="900" y2="260" />
            <line x1="900" y1="260" x2="1080" y2="260" />
            <line x1="1080" y1="260" x2="1080" y2="410" />
            <line x1="1080" y1="410" x2="1110" y2="410" />
            
            <!-- From W2 to Exit -->
            <line x1="1110" y1="410" x2="1070" y2="410" />
            <line x1="1070" y1="410" x2="1070" y2="724" />
            <line x1="1070" y1="724" x2="1070" y2="760" />

            <!-- From Exit to Street -->
            <line x1="1070" y1="760" x2="1070" y2="820" />
            <line x1="1070" y1="820" x2="100" y2="820" />
          </g>
          
          <!-- BLUE Path (Outgoing): Entrance → W1 → Straight down beside Salon Tolid → Right to W2 → Exit -->
          <g stroke="#2196f3" stroke-width="4" stroke-dasharray="12,8" opacity="0.5" fill="none" class="path-animation">
            <!-- From entrance up to Weight Station 1 -->
            <line x1="320" y1="760" x2="320" y2="670" />
            <line x1="320" y1="670" x2="320" y2="580" />
            
            <!-- Continue STRAIGHT DOWN vertically from W1 to beside Anbar Salon Tolid -->
            <line x1="320" y1="580" x2="320" y2="465" />
            
            <!-- Move left to beside Anbar Salon Tolid (outside the building) -->
            <line x1="320" y1="465" x2="280" y2="465" />
            
            <!-- Down beside the building -->
            <line x1="280" y1="465" x2="280" y2="280" />

            <!-- Horizontal path to W2 area (across the top, avoiding buildings) -->
            <line x1="280" y1="280" x2="1110" y2="280" />
            
            <!-- Down to W2 -->
            <line x1="1110" y1="410" x2="1110" y2="410" />
            
            <!-- From W2 to Exit -->
            <line x1="1110" y1="410" x2="1070" y2="410" />
            <line x1="1070" y1="410" x2="1070" y2="724" />
            <line x1="1070" y1="724" x2="1070" y2="760" />

            <!-- From Exit to Street -->
            <line x1="1070" y1="760" x2="1070" y2="820" />
            <line x1="1070" y1="820" x2="100" y2="820" />
          </g>
          
          <!-- ANBAR PAK & AKHAL External Unload Path (OUTSIDE FACTORY) -->
          <g stroke="#ff9800" stroke-width="4" stroke-dasharray="8,6" opacity="0.5" fill="none">
            <!-- Exit factory to street -->
            <line x1="320" y1="760" x2="320" y2="820" />
            
            <!-- Along street to Anbar PAK/Akhal area -->
            <line x1="320" y1="820" x2="1400" y2="820" />
            
            <!-- Up to Anbar PAK (outside) -->
            <line x1="1400" y1="820" x2="1400" y2="650" />
            
            <!-- Re-enter factory to W2 -->
            <line x1="1400" y1="650" x2="1110" y2="650" />
            <line x1="1110" y1="650" x2="1110" y2="410" />
          </g>
        </g>

        <!-- Akhal 2 33 cube (height doubled: 20→40) -->
        <g transform="translate(1040, 40)">
          <!-- Front face (height doubled) -->
          <path d="M 0,15 L 80,15 L 80,55 L 0,55 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
          <text x="40" y="38" text-anchor="middle" font-size="9" font-weight="bold">Akhal 2 33</text>
          <!-- Top face (parallelogram) -->
          <path d="M 0,15 L 20,5 L 100,5 L 80,15 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
          <!-- Right side face (height doubled) -->
          <path d="M 80,15 L 100,5 L 100,45 L 80,55 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
        </g>

        <!-- Right Side: Anbar Khamir Kordan Container (moved up to stick to factory top at y=10) -->
        <g class="right-container">
          <!-- Anbar Khamir KORDAN rect (top sticks to factory at y=10) -->
          <rect x="1170" y="10" width="210" height="650" fill="none" stroke="#000" stroke-width="2" />
          
          <!-- Oval inside (moved up 10px) -->
          <ellipse cx="1260" cy="130" rx="60" ry="95" fill="none" stroke="#000" stroke-width="2" />
          <text x="1260" y="120" text-anchor="middle" font-size="12" font-weight="bold">Anbar</text>
          <text x="1260" y="138" text-anchor="middle" font-size="12" font-weight="bold">Khamir</text>
          <text x="1260" y="156" text-anchor="middle" font-size="12" font-weight="bold">KORDAN</text>
          
          <!-- Akhal 1 100 cube (height doubled: 20→40) -->
          <g transform="translate(1220, 40)">
            <!-- Front face (height doubled) -->
            <path d="M 0,15 L 80,15 L 80,55 L 0,55 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="40" y="38" text-anchor="middle" font-size="9" font-weight="bold">Akhal 1 100</text>
            <!-- Top face (parallelogram) -->
            <path d="M 0,15 L 20,5 L 100,5 L 80,15 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face (height doubled) -->
            <path d="M 80,15 L 100,5 L 100,45 L 80,55 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
          
          <!-- PM4 Area (moved up 10px) -->
          <rect x="1290" y="237" width="65" height="274" fill="#f5f5f5" stroke="#000" stroke-width="2" />
          <!-- Top empty square -->
          <rect x="1295" y="242" width="55" height="55" fill="#fff" stroke="#000" stroke-width="1.5" />
          <!-- Bottom empty square -->
          <rect x="1295" y="451" width="55" height="55" fill="#fff" stroke="#000" stroke-width="1.5" />
          <text x="1322" y="374" text-anchor="middle" font-size="12" font-weight="bold">PM4</text>
        </g>

        <!-- Office (increased 20%: 108×108, moved up with gap below Kordan) -->
        <g class="office">
          <rect x="1170" y="670" width="108" height="108" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="1224" y="729" text-anchor="middle" font-size="12" font-weight="bold">Office</text>
        </g>

        <!-- Weight Station 2 (narrower, taller, moved down, stick to Kordan at x=1170) -->
        <g class="weight-station-2">
          <rect x="1110" y="320" width="60" height="180" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="1140" y="395" text-anchor="middle" font-size="11" font-weight="bold">Weight</text>
          <text x="1140" y="415" text-anchor="middle" font-size="11" font-weight="bold">Station</text>
          <text x="1140" y="435" text-anchor="middle" font-size="11" font-weight="bold">2</text>
        </g>

        <!-- Anbar PAK (bottom edge aligns with factory bottom at y=783) -->
        <g class="anbar-pak">
          <!-- PAK narrow rect (bottom at y=783, aligned with factory) -->
          <rect x="1380" y="460" width="60" height="323" fill="#f5f5f5" stroke="#000" stroke-width="2" />
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
          <rect x="260" y="760" width="120" height="42" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="320" y="785" text-anchor="middle" font-size="12">Entrance</text>
          
          <!-- Right entrance - moved to right -->
          <rect x="1010" y="760" width="120" height="42" fill="#fff" stroke="#000" stroke-width="2" />
          <text x="1070" y="785" text-anchor="middle" font-size="12">Exit</text>
        </g>

        <!-- STATIC FORKLIFTS (Always Visible - Ready State - BIGGER) -->
        <g class="static-forklifts">
          <!-- Forklift 1 - Near Loading Zone -->
          <g transform="translate(500, 610)">
            <text x="0" y="0" font-size="45" text-anchor="middle">🚜</text>
            <circle cx="-18" cy="-20" r="7" fill="#4caf50" stroke="#fff" stroke-width="2" />
            <text x="0" y="30" text-anchor="middle" font-size="10" fill="#4caf50" font-weight="bold">READY</text>
          </g>
          
          <!-- Forklift 2 - Near Anbar Sangin -->
          <g transform="translate(750, 425)">
            <text x="0" y="0" font-size="45" text-anchor="middle">🚜</text>
            <circle cx="-18" cy="-20" r="7" fill="#4caf50" stroke="#fff" stroke-width="2" />
            <text x="0" y="30" text-anchor="middle" font-size="10" fill="#4caf50" font-weight="bold">READY</text>
          </g>
          
          <!-- Forklift 3 - Near Anbar PAK -->
          <g transform="translate(1350, 620)">
            <text x="0" y="0" font-size="45" text-anchor="middle">🚜</text>
            <circle cx="-18" cy="-20" r="7" fill="#4caf50" stroke="#fff" stroke-width="2" />
            <text x="0" y="30" text-anchor="middle" font-size="10" fill="#4caf50" font-weight="bold">READY</text>
          </g>
          
          <!-- Forklift 4 - Near Anbar Salon Tolid -->
          <g transform="translate(260, 237)">
            <text x="0" y="0" font-size="45" text-anchor="middle">🚜</text>
            <circle cx="-18" cy="-20" r="7" fill="#4caf50" stroke="#fff" stroke-width="2" />
            <text x="0" y="30" text-anchor="middle" font-size="10" fill="#4caf50" font-weight="bold">READY</text>
          </g>
        </g>

        <!-- Anbar Akhal (moved up 42px, height 5x: 25*5=125) -->
        <g class="anbar-akhal-bottom">
          <rect x="40" y="843" width="320" height="125" fill="none" stroke="#000" stroke-width="2" />
          <text x="200" y="860" text-anchor="middle" font-size="12" font-weight="bold">Anbar Akhal</text>
          
          <!-- Akhal 3 114 cube -->
          <g transform="translate(50, 875)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="31" text-anchor="middle" font-size="8" font-weight="bold">Akhal 3 114</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
          
          <!-- Akhal 4 260 cube -->
          <g transform="translate(135, 875)">
            <!-- Front face (height doubled) -->
            <path d="M 0,12 L 50,12 L 50,44 L 0,44 Z" fill="#ddd" stroke="#000" stroke-width="1.5" />
            <text x="25" y="31" text-anchor="middle" font-size="8" font-weight="bold">Akhal 4 260</text>
            <!-- Top face -->
            <path d="M 0,12 L 12,5 L 62,5 L 50,12 Z" fill="#eee" stroke="#000" stroke-width="1.5" />
            <!-- Right side face -->
            <path d="M 50,12 L 62,5 L 62,37 L 50,44 Z" fill="#bbb" stroke="#000" stroke-width="1.5" />
          </g>
          
          <!-- Akhal 2 170 cube -->
          <g transform="translate(220, 875)">
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

        <!-- Warehouse Inventory Badges (Dynamic) -->
        <g class="warehouse-badges">
          <g 
            v-for="warehouse in warehouseNames" 
            :key="warehouse"
            :transform="`translate(${warehouseBadgePositions[warehouse].x}, ${warehouseBadgePositions[warehouse].y})`"
          >
            <!-- Badge background -->
            <circle cx="0" cy="0" r="22" fill="#667eea" stroke="#fff" stroke-width="3" opacity="0.95" />
            <!-- Count text -->
            <text 
              x="0" 
              y="6" 
              text-anchor="middle" 
              font-size="14" 
              font-weight="bold" 
              fill="#fff"
            >
              {{ getWarehouseCount(warehouse) }}
            </text>
            <!-- Warehouse name tooltip on hover -->
            <title>{{ formatWarehouseName(warehouse) }}: {{ getWarehouseCount(warehouse) }} reels</title>
          </g>
        </g>

        <!-- Active Trucks (Dynamic - Workflow Animation - REALISTIC SHAPE WITH ROTATION) -->
        <g class="active-trucks">
          <g 
            v-for="(shipment, index) in activeShipments" 
            :key="shipment.id"
            :style="{ 
              transform: `translate(${getTruckPosition(shipment).x}px, ${getTruckPosition(shipment).y}px)`,
              transition: 'transform 3s ease-in-out'
            }"
            class="truck-animated"
          >
            <!-- Professional 2D Flat Truck (Clean Simple Design with Rotation) -->
            <g :transform="`translate(${-75 - (index % 3) * 20}, ${-65 - Math.floor(index / 3) * 70}) rotate(${getTruckRotation(shipment)} 75 65)`">
              
              <!-- Motion trail effect (if truck is moving) -->
              <g v-if="shipment.status === 'Registered' || shipment.status === 'LoadedUnloaded'" class="motion-trail" opacity="0.4">
                <ellipse cx="45" cy="90" rx="30" ry="8" :fill="shipment.shipment_type === 'Incoming' ? '#4caf50' : '#2196f3'" class="trail-pulse" />
                <ellipse cx="25" cy="90" rx="20" ry="6" :fill="shipment.shipment_type === 'Incoming' ? '#4caf50' : '#2196f3'" class="trail-pulse" style="animation-delay: 0.2s" />
                <ellipse cx="10" cy="90" rx="15" ry="4" :fill="shipment.shipment_type === 'Incoming' ? '#4caf50' : '#2196f3'" class="trail-pulse" style="animation-delay: 0.4s" />
              </g>
              
              <!-- Flat Shadow (2D) -->
              <ellipse cx="75" cy="88" rx="65" ry="8" fill="#00000025" />
              
              <!-- === CARGO CONTAINER (Back part) === -->
              <rect 
                x="55" 
                y="25" 
                width="95" 
                height="55" 
                :fill="shipment.shipment_type === 'Incoming' ? '#4caf50' : '#2196f3'" 
                stroke="#1a1a1a" 
                stroke-width="2.5" 
                rx="3"
              />
              
              <!-- Container door panels (vertical lines) -->
              <line x1="90" y1="28" x2="90" y2="77" stroke="#1a1a1a" stroke-width="2" opacity="0.4" />
              <line x1="120" y1="28" x2="120" y2="77" stroke="#1a1a1a" stroke-width="2" opacity="0.4" />
              
              <!-- Container horizontal line (middle) -->
              <line x1="60" y1="52" x2="145" y2="52" stroke="#1a1a1a" stroke-width="1.5" opacity="0.3" />
              
              <!-- === CABIN (Front part - Flat 2D) === -->
              <path 
                d="M 0,40 L 0,75 L 5,80 L 55,80 L 55,28 L 50,25 L 10,25 Z" 
                :fill="shipment.shipment_type === 'Incoming' ? '#66bb6a' : '#64b5f6'" 
                stroke="#1a1a1a" 
                stroke-width="2.5"
              />
              
              <!-- Windshield (2D flat) -->
              <rect 
                x="8" 
                y="28" 
                width="40" 
                height="10" 
                fill="#90caf9" 
                stroke="#1a1a1a" 
                stroke-width="2"
                opacity="0.85"
              />
              
              <!-- Side window -->
              <rect x="8" y="45" width="18" height="20" fill="#90caf9" stroke="#1a1a1a" stroke-width="1.5" opacity="0.85" />
              
              <!-- === WHEELS (2D Flat Circles) === -->
              <g>
                <!-- Front wheel -->
                <circle cx="18" cy="82" r="9" fill="#2c3e50" stroke="#1a1a1a" stroke-width="2" />
                <circle cx="18" cy="82" r="5" fill="#546e7a" />
                <circle cx="18" cy="82" r="2" fill="#1a1a1a" />
                
                <!-- Middle wheel (under cabin/container junction) -->
                <circle cx="68" cy="82" r="9" fill="#2c3e50" stroke="#1a1a1a" stroke-width="2" />
                <circle cx="68" cy="82" r="5" fill="#546e7a" />
                <circle cx="68" cy="82" r="2" fill="#1a1a1a" />
                
                <!-- Back wheel -->
                <circle cx="132" cy="82" r="9" fill="#2c3e50" stroke="#1a1a1a" stroke-width="2" />
                <circle cx="132" cy="82" r="5" fill="#546e7a" />
                <circle cx="132" cy="82" r="2" fill="#1a1a1a" />
              </g>
              
              <!-- Headlights (simple 2D) -->
              <circle cx="2" cy="70" r="3" fill="#ffeb3b" stroke="#1a1a1a" stroke-width="1" opacity="0.9" />
              
              <!-- Grille (simple vertical lines) -->
              <line x1="0" y1="55" x2="0" y2="68" stroke="#1a1a1a" stroke-width="2.5" />
              <rect x="1" y="56" width="4" height="11" fill="#263238" opacity="0.6" />
              
              <!-- Status Indicator (large, prominent) -->
              <circle 
                cx="145" 
                cy="15" 
                r="10" 
                :fill="shipment.status === 'LoadingUnloading' ? '#ff5722' : (shipment.shipment_type === 'Incoming' ? '#4caf50' : '#2196f3')"
                stroke="#fff"
                stroke-width="3"
                :class="{ 'blink-animation': shipment.location === 'Weight_Station_1' || shipment.status === 'LoadingUnloading' }"
              />
              
              <!-- License Plate (large, on container) -->
              <rect 
                x="65" 
                y="40" 
                width="70" 
                height="20" 
                fill="#ffffff" 
                stroke="#000" 
                stroke-width="2.5" 
                rx="3"
              />
              
              <text 
                x="100" 
                y="53" 
                text-anchor="middle" 
                font-size="12" 
                font-weight="bold" 
                fill="#000"
                font-family="Arial, sans-serif"
              >
                {{ shipment.license_number }}
              </text>
              
              <!-- Status text below truck -->
              <rect 
                x="20" 
                y="100" 
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
                x="75" 
                y="112" 
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
            <g v-if="shipment.status === 'LoadingUnloading'">
              <!-- Position forklift near the truck (bigger offset for bigger truck) -->
              <g 
                :transform="`translate(${getTruckPosition(shipment).x + 80 + (index % 2) * 50}, ${getTruckPosition(shipment).y - 15})`"
                class="forklift-animated"
              >
                <!-- Forklift Emoji Icon (Bigger) -->
                <text 
                  x="0" 
                  y="0" 
                  font-size="50" 
                  text-anchor="middle"
                >🚜</text>
                
                <!-- Blinking WORKING indicator (Bigger) -->
                <circle cx="-20" cy="-22" r="8" fill="#ff5722" class="blink-animation" stroke="#fff" stroke-width="2.5" />
                
                <!-- Pallet/Box being moved (Bigger) -->
                <text 
                  x="35" 
                  y="8" 
                  font-size="35" 
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
          <rect x="1280" y="843" width="400" height="125" fill="#5c6bc0" opacity="0.95" rx="10" stroke="#fff" stroke-width="4" />
          
          <!-- Title with Icon -->
          <text x="1480" y="865" text-anchor="middle" font-size="13" font-weight="bold" fill="#fff">
            📊 STATUS
          </text>
          
          <!-- === Row 1: TRUCKS === -->
          <text x="1295" y="888" font-size="10" fill="#ffd54f" font-weight="bold">
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
          <text x="1295" y="935" font-size="11" fill="#b39ddb" font-weight="bold">
            📦 Stock:
          </text>
          <text x="1665" y="935" text-anchor="end" font-size="18" fill="#fff" font-weight="bold">
            {{ totalInventory }}
          </text>
        </g>
      </svg>
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

.truck-animated:hover g {
  transform: scale(1.1);
  transition: transform 0.2s ease;
}

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

.warehouse-badges g:hover circle {
  r: 26;
  opacity: 1;
  filter: drop-shadow(0 0 12px rgba(102, 126, 234, 0.9));
}

.warehouse-badges text {
  pointer-events: none;
  user-select: none;
  transition: font-size 0.3s ease;
}

.warehouse-badges g:hover text {
  font-size: 16px;
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
</style>

