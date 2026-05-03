# /backend/stock/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # GET  /api/stock/pieces/      → liste toutes les pièces
    # POST /api/stock/pieces/      → crée une nouvelle pièce
    path('pieces/', views.piece_list, name='piece_list'),

    # GET    /api/stock/pieces/42/ → détail de la pièce 42
    # PUT    /api/stock/pieces/42/ → modifier complètement
    # PATCH  /api/stock/pieces/42/ → modifier partiellement (stock, prix...)
    # DELETE /api/stock/pieces/42/ → supprimer
    path('pieces/<int:pk>/', views.piece_detail, name='piece_detail'),
]
