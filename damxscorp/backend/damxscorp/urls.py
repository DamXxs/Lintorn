from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # Interface admin Django
    path('admin/', admin.site.urls),
    
    # URLs de chaque app
    path('api/clients/', include('clients.urls')),
    path('api/vehicules/', include('vehicules.urls')),
    path('api/planning/', include('planning.urls')),
    path('api/stock/', include('stock.urls')),
    path('api/fournisseurs/', include('fournisseurs.urls')),
]