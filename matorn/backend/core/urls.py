# /backend/core/urls.py
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse

def health_check(request):
    return JsonResponse({'status': 'ok', 'message': 'Django backend is running'})

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health_check, name='health_check'),
    
    # ← NOUVEAU : routes d'authentification
    path('api/auth/', include('accounts.urls')),
    
    # Routes des apps existantes
    path('api/clients/', include('clients.urls')),
    path('api/vehicules/', include('vehicules.urls')),
    path('api/', include('planning.urls')),
    path('api/stock/', include('stock.urls')),
    path('api/fournisseurs/', include('fournisseurs.urls')),
    path('api/referentiels/', include('referentiels.urls')),
    path('api/factures/', include('factures.urls')),
    path('api/archives/', include('archives.urls')),
    path('api/ordres-reparation/', include('ordres_reparation.urls')),
]