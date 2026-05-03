# /backend/core/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'ok', 'message': 'Django backend is running'})

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Health check
    path('api/health/', health_check, name='health_check'),
    
    # Routes des apps
    path('api/clients/', include('clients.urls')),
    path('api/vehicules/', include('vehicules.urls')),
    path('api/', include('planning.urls')),  # ← IMPORTANT : pas de préfixe "planning/"
    path('api/stock/', include('stock.urls')),
    path('api/fournisseurs/', include('fournisseurs.urls')),
    path('api/referentiels/', include('referentiels.urls')),
    path('api/factures/', include('factures.urls')),
]