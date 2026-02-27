# /backend/clients/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # /api/clients/       → liste + création
    path('', views.client_list, name='client_list'),

    # /api/clients/42/    → détail + modif + suppression
    path('<int:pk>/', views.client_detail, name='client_detail'),
]