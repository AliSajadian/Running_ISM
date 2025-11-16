<!-- f67f24ca-4ff1-46a8-8fd5-c3053aa340a7 4829fbec-b3b2-4bd7-a5fe-0ec195b6e33e -->
# Factory Map Animation System

## Overview

Create a Vue.js page with SVG-based factory map showing animated truck movements through incoming/outgoing processes and warehouse inventory tracking.

## Architecture

### Frontend (Vue.js + SVG)

- Create new `FactoryMap.vue` component with embedded SVG map matching the provided image
- Use CSS transitions for smooth truck/forklift animations between locations
- Poll backend API every 60 seconds for active shipments and warehouse inventory
- Display warehouse inventory counts (pallets/reels) as badges on each warehouse area

### Backend (Django)

- Create API endpoint to return active shipments with current location and statusy 
- Create API endpoint to return warehouse inventory counts (pallets/reels per warehouse)
- Leverage existing Shipments model fields: `status`, `location`, `shipment_type`
- Query Anbar models for inventory counts

## Implementation Steps

### 1. Backend API Endpoints

**File: `v900_Clean/myapp/views.py`**

Add two new API endpoints:

```python
@csrf_exempt
def get_factory_map_data(request):
    # Returns active shipments with location/status for animation
    # Query Shipments.objects.exclude(status='Cancelled')
    # Filter where status in ['Registered', 'LoadingUnloading', 'LoadedUnloaded']
    # Return: shipment_id, shipment_type, status, location, license_number
```



```python
@csrf_exempt
def get_warehouse_inventory(request):
    # Returns count of pallets/reels in each warehouse
    # Query each Anbar model (Anbar_PAK, Anbar_Sangin, Anbar_Khamir_Kordan, etc.)
    # Count records where status='In-stock'
    # Group by warehouse location
    # Return: warehouse_name, reel_count, total_pallets
```

**File: `v900_Clean/myapp/urls.py`**

Add URL routes:

```python
path("api/getFactoryMapData", get_factory_map_data),
path("api/getWarehouseInventory", get_warehouse_inventory),
```

### 2. Frontend Component

**File: `v900_Clean/frontend/src/components/FactoryMap.vue`**

Create new component with:

**Template Section:**

- Main SVG container (viewBox matching factory dimensions)
- Define warehouse areas as SVG rect/polygon elements matching the provided map
- Truck elements (animated circles/rects with license numbers)
- Forklift elements at loading/unloading locations
- Warehouse inventory badges (showing reel counts)
- Legend showing status colors and what each icon represents

**Script Section:**

- Data properties: `activeShipments`, `warehouseInventory`, `pollingInterval`
- Method `fetchMapData()` - calls both APIs and updates state
- Method `getTruckPosition(location)` - returns x,y coordinates for each location
- Method `getWarehousePosition(warehouseName)` - returns x,y for warehouse centers
- Computed property `trucksAtLocation` - groups trucks by current location
- Lifecycle: `mounted()` - start polling, `beforeUnmount()` - clear interval

**Style Section:**

- CSS transitions for truck movement (transition: all 2s ease-in-out)
- Color coding: green=incoming, blue=outgoing, red=forklift active
- Warehouse badges with hover tooltips showing details
- Responsive sizing for different screen sizes

### 3. Location Mapping

Define location coordinates mapping in Vue component:

```javascript
// Updated for 1600×900 viewBox (16:9 wide format)
locationCoordinates: {
  'Entrance': { x: 1400, y: 800 },
  'Weight_Station_1': { x: 1300, y: 650 },
  'Weight_Station_2': { x: 1300, y: 400 },
  'Exit': { x: 1400, y: 200 },
  'Anbar_PAK': { x: 200, y: 200 },
  'Anbar_Khamir_Kordan': { x: 450, y: 200 },
  'Anbar_Khamir_Ghadim': { x: 700, y: 200 },
  'Anbar_Parvandeh': { x: 950, y: 200 },
  'Anbar_Koochak': { x: 450, y: 500 },
  'Anbar_Sangin': { x: 700, y: 500 },
  'Anbar_Salon_Tolid': { x: 200, y: 700 },
  'Loading_Unloading': { x: 800, y: 650 },
  'Office': { x: 1100, y: 700 },
}
```

### 4. Router Integration

**File: `v900_Clean/frontend/src/router/index.js`**

Add route:

```javascript
{
  path: '/myapp/factoryMap/',
  name: 'FactoryMap',
  component: () => import('@/components/FactoryMap.vue')
}
```

**File: `v900_Clean/myapp/urls.py`**

Add Django route:

```python
path("factoryMap/", factory_map_page, name="factory_map_page"),
```

**File: `v900_Clean/myapp/views.py`**

Add view:

```python
def factory_map_page(request):
    return render(request, '_base_vue.html')
```

### 5. Navigation Link

**File: `v900_Clean/frontend/src/components/admin/AllPages.vue`**

Add button to navigate to factory map page.

## Key Features

1. **Real-time Animation**: Trucks smoothly transition between locations based on status/location fields
2. **Color Coding**: Different colors for incoming (green), outgoing (blue), and active loading (orange)
3. **Warehouse Badges**: Show live count of pallets/reels in each warehouse
4. **Auto-refresh**: Poll API every 60 seconds (configurable)
5. **Manual Refresh**: Button to force immediate update
6. **Tooltips**: Hover over trucks/warehouses for details (license number, material type, etc.)
7. **Responsive**: Scale to different screen sizes while maintaining aspect ratio

## Database Fields Used

From Shipments model:

- `status`: Track workflow step (Registered, LoadingUnloading, LoadedUnloaded, etc.)
- `location`: Current physical location in factory
- `shipment_type`: Incoming vs Outgoing
- `license_number`: Display on truck icon
- `unload_location`: Target warehouse for incoming shipments

From Anbar models:

- `status='In-stock'`: Count active inventory
- `reel_number`: Count individual reels
- All warehouse models (Anbar_PAK, Anbar_Sangin, etc.)

## Animation Logic

**Truck Position Calculation:**

- Map `location` field value to SVG coordinates
- Apply CSS transition for smooth movement
- Update position when location changes

**Forklift Display:**

- Show forklift icon when status='LoadingUnloading' at warehouse locations
- Animate simple back-and-forth movement

**Status-based Workflow:**

1. Incoming: Entrance → Weight1 → Warehouse → Weight2 → Exit
2. Outgoing: Entrance → Weight1 → Anbar_Salon_Tolid → Weight2 → Exit
3. Internal Movement: Tracked via location field changes

This implementation leverages your existing database structure without requiring schema changes, uses simple SVG animations, and provides a clear visual overview of factory operations.

### To-dos

- [ ] Create get_factory_map_data() API endpoint in views.py to return active shipments with location/status
- [ ] Create get_warehouse_inventory() API endpoint in views.py to return reel counts per warehouse
- [ ] Add API routes in urls.py for both new endpoints and factoryMap page route
- [ ] Create FactoryMap.vue component with SVG map structure matching the provided image
- [ ] Implement API polling logic with 60-second interval to fetch map data and warehouse inventory
- [ ] Implement truck positioning and CSS transitions based on location field
- [ ] Add warehouse inventory count badges with tooltips on SVG map
- [ ] Add forklift icons at loading/unloading locations when status=LoadingUnloading
- [ ] Add FactoryMap route to Vue router and Django urls, create factory_map_page view
- [ ] Add navigation button in AllPages.vue to access factory map