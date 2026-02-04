from django.contrib import admin
from django.urls import path
from core import views  # On importe tes vues depuis l'app core

urlpatterns = [
    path('api/interventions/', views.api_interventions),
    path('api/interventions/<int:pk>/', views.api_interventions_detail),
]