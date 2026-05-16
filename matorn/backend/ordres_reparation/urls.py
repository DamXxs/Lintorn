# /backend/ordres_reparation/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # ============================================================
    # ORDRES DE RÉPARATION
    # ============================================================
    # /api/ordres-reparation/         → liste + création
    path('', views.ordre_reparation_list, name='or_list'),
    
    # /api/ordres-reparation/42/      → détail + modif + suppression
    path('<int:pk>/', views.ordre_reparation_detail, name='or_detail'),
    
    # /api/ordres-reparation/42/cloturer/    → action de clôture
    path('<int:pk>/cloturer/', views.ordre_reparation_cloturer, name='or_cloturer'),

    # /api/ordres-reparation/42/decloturer/ → action de déclôture
    path('<int:pk>/decloturer/', views.ordre_reparation_decloturer, name='or_decloturer'),
    
    # ============================================================
    # LIGNES PIÈCES UTILISÉES
    # ============================================================
    # /api/ordres-reparation/42/pieces/   → liste/ajout pour OR 42
    path('<int:ordre_id>/pieces/', views.ligne_piece_list, name='ligne_piece_list'),
    
    # /api/ordres-reparation/lignes-pieces/123/  → détail/modif/suppression
    path('lignes-pieces/<int:pk>/', views.ligne_piece_detail, name='ligne_piece_detail'),
    
    # ============================================================
    # LIGNES INTERVENTIONS (MAIN D'ŒUVRE)
    # ============================================================
    # /api/ordres-reparation/42/interventions/
    path('<int:ordre_id>/interventions/', views.ligne_intervention_list, name='ligne_intervention_list'),
    
    # /api/ordres-reparation/lignes-interventions/123/
    path('lignes-interventions/<int:pk>/', views.ligne_intervention_detail, name='ligne_intervention_detail'),
]