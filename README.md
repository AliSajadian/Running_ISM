### What this project is

-   Stack: Django 4 + Channels (ASGI via daphne) + Vue 3 (Vue CLI) + Tailwind.

-   Domain: Inventory/Shipment Management for a factory/warehouse workflow in Farsi (timezone Asia/Tehran).

-   Modules: Trucks, Shipments, Products, Purchases, Sales, Suppliers, Customers, Raw Material, plus reports and forklift/weight-station operations.

### High-level architecture

-   Backend (Django):

-   URL root: backend/urls.py mounts myapp at /myapp/.

-   HTTP endpoints and pages live in myapp/urls.py and myapp/views.py.

-   Data models in myapp/models.py with SQLite by default (PostgreSQL commented).

-   Websocket (Channels) at ws://<host>/ws/alert/ for alerts.

-   Frontend (Vue 3 SPA):

-   Router defines routes under /myapp/... that mirror server pages.

-   Can be built into static/ + templates/_base_vue.html for Django to serve.

### Core data models (partial list)

-   Truck, Shipments, Products, Supplier, Customer, RawMaterial, Purchases, Sales (and more in myapp/models.py).

-   Example (snippet of models to click/jump to):

```
    models.py

    class Truck(models.Model):

    class Shipments(models.Model):

```

### Backend URLs and APIs

-   Root mapping:
```
    urls.py

    urlpatterns = [

        path("admin/", admin.site.urls),

        path("myapp/", include('myapp.urls'), name='myapp'),

    ]
```

-   App routes (HTTP APIs under /myapp/api/..., and page routes).

-   Lists and lookups: suppliers, customers, materials, units, widths, reels, license numbers.

-   Shipment lifecycle: create/load/unload/move/return/use; query shipment details by license, by status/location.

-   Weight station: show/update weights.

-   Purchasing/Sales: create orders; pricing, VAT, totals.

-   Reports: Excel, shipments, sales, purchases, raw material, products, consumption, alerts.

-   Logging: weight adjustment.

```
    urls.py

    # APIs

    path("api/checkLicenseNumber", check_license_number),

    path("api/addTruck", add_truck),

    path("api/unload", unload),

    path("api/loaded", loaded),

    path("api/used", used),

    path("api/moved", moved),

    path("api/retuned", retuned),

    path('api/logWeightAdjustment', log_weight_adjustment, name='log_weight_adjustment'),

```

    # Pages
```
    path("", all_pages),

    path("addCustomer/", add_customer),
```
-   Views are simple JsonResponse endpoints, many @csrf_exempt. Example:

    views.py
```
    @csrf_exempt
```
```
    def check_license_number(request):

        if request.method == 'POST':

            license_number = request.GET.get('license_number')

```

### Websocket alerts

-   ``` Path: /ws/alert/; group name: "alert".```

-   Server broadcasts via not_enough_alert(...) in views; consumer forwards JSON to clients.
```
    asgi.py

    "websocket": AllowedHostsOriginValidator(

        AuthMiddlewareStack(URLRouter(websocket_urlpatterns))

    )
```
```
    routing.py

    websocket_urlpatterns = [

        re_path(r'ws/alert/', consumers.AlertConsumer.as_asgi()),

    ]
```
```
    consumers.py

    class AlertConsumer(AsyncWebsocketConsumer):

        async def connect(self):

            await self.channel_layer.group_add("alert", self.channel_name)

            await self.accept()

        async def alert_message(self, event):

            await self.send(text_data=json.dumps({'message': event['message'],'data': event['data']}))
```

Minimal client example:

javascript
```
const ws = new WebSocket('ws://127.0.0.1:8000/ws/alert/');

ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

### Frontend routes (Vue)

-   Client-side paths under /myapp/... for trucks, suppliers/customers/materials, forklift panel, weight station, admin (anbar/unit/material types), cancel, reports, products.

    index.js
    
```
    { path: '/myapp/addTruck/', component: addTruck },

    { path: '/myapp/weightStationPanel/', component: weightStationPanel },

    { path: '/myapp/report/', component: reportPage },

    { path: '/myapp/ProductsPage/', component: Products },

```

### Main workflows (as expressed in code)

-   Incoming process:

-   Add Truck → Add Shipment → Weight 1 → Forklift unload (unload/move/return/use) → Weight 2 → Create Purchase Order.

-   Outgoing process:

-   Create Sales Order → Load list of reels → Weight 1/2 → Delivery.

-   Reporting:

-   Per area (shipments, sales, purchases, products, raw material, consumption, alerts) including Excel generation.

### How to run locally (simplest path: build SPA, then run Django)

-   Backend

-   Python 3.10+ recommended.

-   In repo root:

    shellscript
```
        python -m venv .venv

        .\.venv\Scripts\activate

        pip install -r requirements.txt

        python manage.py migrate

        python manage.py runserver
```

-   Frontend (one-time build; Django will serve assets)

-   In frontend/:

```

        npm install

        npm run build
```

-   Then open http://127.0.0.1:8000/myapp/ (SPA served via templates/_base_vue.html and /static/).

Notes:

-   Default DB is SQLite (backend/settings.py). PostgreSQL config is present but commented.

-   If you prefer live frontend dev with npm run serve (port 8080), you may need to add http://localhost:8080 to CORS_ALLOWED_ORIGINS and configure a dev proxy, since axios defaults to same-origin.
