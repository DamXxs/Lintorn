# /backend/factures/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Paramètres (singleton)
    path('parametres/', views.parametres_view, name='factures-parametres'),

    # Forfaits Intervention (catalogue main d'œuvre personnalisable)
    path('forfaits/', views.forfait_list, name='forfait-list'),
    path('forfaits/<int:pk>/', views.forfait_detail, name='forfait-detail'),

    # Devis
    path('devis/', views.devis_list, name='devis-list'),
    path('devis/<int:pk>/', views.devis_detail, name='devis-detail'),
    path('devis/<int:pk>/valider/', views.devis_valider, name='devis-valider'),
    path('devis/<int:pk>/refuser/', views.devis_refuser, name='devis-refuser'),
    path('devis/<int:pk>/creer-facture/', views.devis_creer_facture, name='devis-creer-facture'),

    # Lignes Devis
    path('devis/<int:devis_id>/lignes/', views.ligne_devis_list, name='ligne-devis-list'),
    path('lignes-devis/<int:pk>/', views.ligne_devis_detail, name='ligne-devis-detail'),

    # Factures
    path('factures/', views.facture_list, name='facture-list'),
    path('factures/<int:pk>/', views.facture_detail, name='facture-detail'),
    path('factures/<int:pk>/paiement/', views.facture_enregistrer_paiement, name='facture-paiement'),

    # Lignes Facture
    path('factures/<int:facture_id>/lignes/', views.ligne_facture_list, name='ligne-facture-list'),
    path('lignes-factures/<int:pk>/', views.ligne_facture_detail, name='ligne-facture-detail'),
]
