# /backend/damxscorp/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

# Fonction simple pour le health check
def health_check(request):
    """Endpoint pour vérifier que Django fonctionne"""
    return JsonResponse({
        'status': 'ok',
        'message': 'Django backend is running'
    })

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Health check
    path('api/health/', health_check, name='health_check'),
    
    # Routes des apps
    path('api/clients/', include('clients.urls')),
    path('api/vehicules/', include('vehicules.urls')),
    path('api/planning/', include('planning.urls')),
    path('api/stock/', include('stock.urls')),
    path('api/fournisseurs/', include('fournisseurs.urls')),
]