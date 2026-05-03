# /backend/referentiels/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('',          views.referentiel_list,   name='referentiel_list'),
    path('<int:pk>/', views.referentiel_detail, name='referentiel_detail'),
]