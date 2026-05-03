# /backend/archives/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # GET  /api/archives/                       → liste unifiée
    path('', views.archives_list, name='archives_list'),
    
    # GET  /api/archives/types/                 → liste des types
    path('types/', views.types_archivables, name='archives_types'),
    
    # POST /api/archives/<type>/<id>/restore/   → restaurer
    path('<str:type_url>/<int:pk>/restore/', views.restore_element, name='archives_restore'),
    
    # DELETE /api/archives/<type>/<id>/purge/   → purger définitivement
    path('<str:type_url>/<int:pk>/purge/', views.purge_element, name='archives_purge'),
]