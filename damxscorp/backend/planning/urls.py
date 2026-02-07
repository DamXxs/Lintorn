# /backend/planning/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Liste et création
    path('interventions/', views.intervention_list, name='intervention_list'),
    
    # Détail, modification, suppression
    path('interventions/<int:pk>/', views.intervention_detail, name='intervention_detail'),
]