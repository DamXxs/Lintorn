# /backend/vehicules/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # /api/vehicules/       → liste + création
    path('', views.vehicule_list, name='vehicule_list'),

    # /api/vehicules/42/    → détail + modif + suppression
    path('<int:pk>/', views.vehicule_detail, name='vehicule_detail'),
]