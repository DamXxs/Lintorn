# /backend/fournisseurs/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # /api/fournisseurs/          → liste + création
    path('', views.fournisseur_list, name='fournisseur_list'),

    # /api/fournisseurs/alertes/  → fournisseurs ayant des pièces en alerte (dashboard)
    # ⚠️ Cette route doit être AVANT <int:pk>/ sinon Django croit que "alertes" est un ID
    path('alertes/', views.fournisseurs_avec_alertes, name='fournisseurs_alertes'),

    # /api/fournisseurs/42/       → détail + modif + suppression
    path('<int:pk>/', views.fournisseur_detail, name='fournisseur_detail'),

    # /api/fournisseurs/42/email-commande/  → email pré-rempli pour ce fournisseur
    path('<int:pk>/email-commande/', views.generer_email_commande, name='email_commande'),
]
