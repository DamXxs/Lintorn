from django.urls import path
from core import views

urlpatterns = [
    path('interventions/', views.api_interventions), # Deviendra /api/interventions/
    path('interventions/<int:pk>/', views.api_interventions_detail), # Deviendra /api/interventions/ID/
]