from django.apps import apps
from django.db import connection

def load_warehouse_models():
    models = []
    for table in connection.introspection.table_names():
        if table.startswith('Anbar_'):
            try:
                models.append(apps.get_model('myapp', table))
            except LookupError:
                pass
    return models

WAREHOUSE_MODELS = load_warehouse_models()
