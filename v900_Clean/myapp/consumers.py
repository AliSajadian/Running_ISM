from channels.generic.websocket import AsyncWebsocketConsumer
import json
from datetime import datetime, timedelta

class AlertConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("alert", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard("alert", self.channel_name)

    async def receive(self, text_data):
        pass

    async def alert_message(self, event):
        message = event['message']
        data = event['data']
        await self.send(text_data=json.dumps({
            'message': message,
            'data': data
        }))


# In-memory storage for recent movements (shared across connections)
# Using a simple list - list operations in Python are thread-safe for our use case
recent_movements = []
recent_updated_warehouses = []

class MovementConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for warehouse movement notifications.
    Stores recent movements in memory and sends them to late-joining clients.
    """
    
    async def connect(self):
        # Join the factory_movements group
        await self.channel_layer.group_add("factory_movements", self.channel_name)
        await self.accept()
        
        # Send pending movements to the newly connected client
        await self.send_pending_movements()
    
    async def disconnect(self, close_code):
        # Leave the factory_movements group
        await self.channel_layer.group_discard("factory_movements", self.channel_name)
    
    async def receive(self, text_data):
        # Client doesn't need to send messages, but we can handle acknowledgments here
        pass
    
    async def send_pending_movements(self):
        """Send all pending movements from the last 10 minutes to new client"""
        global recent_movements
        # Clean up old movements (older than 10 minutes)
        cutoff_time = datetime.now() - timedelta(minutes=10)
        recent_movements = [m for m in recent_movements if m['timestamp'] > cutoff_time]
        
        # Send pending movements to this client
        for movement in recent_movements:
            await self.send(text_data=json.dumps({
                'type': 'movement',
                'from_anbar': movement['from_anbar'],
                'to_anbar': movement['to_anbar'],
                'quantity': movement['quantity'],
                'material_type': movement['material_type'],
                'pending': True  # Flag to indicate this is a queued movement
            }))
    
    async def movement_message(self, event):
        """Handle movement broadcast from views"""
        # Send the movement to this WebSocket client
        await self.send(text_data=json.dumps({
            'type': 'movement',
            'from_anbar': event['from_anbar'],
            'to_anbar': event['to_anbar'],
            'quantity': event['quantity'],
            'material_type': event['material_type'],
            'pending': False  # Real-time movement
        }))


def add_movement_to_queue(from_anbar, to_anbar, quantity, material_type):
    """Helper function to add movement to the in-memory queue (sync version)"""
    global recent_movements
    recent_movements.append({
        'from_anbar': from_anbar,
        'to_anbar': to_anbar,
        'quantity': quantity,
        'material_type': material_type,
        'timestamp': datetime.now()
    })

def add_updated_warehouse_to_queue(warehouse_name):
    """Helper function to add loading to the in-memory queue (sync version)"""
    global recent_updated_warehouses
    recent_updated_warehouses.append({
        'warehouse_name': warehouse_name,
        'timestamp': datetime.now()
    })
 
