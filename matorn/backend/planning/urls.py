# /backend/planning/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # ── Interventions ────────────────────────────────────────────────────────
    path('interventions/',          views.intervention_list,   name='intervention_list'),
    path('interventions/<int:pk>/', views.intervention_detail, name='intervention_detail'),

    # ── Départements ─────────────────────────────────────────────────────────
    path('departements/',          views.departement_list,   name='departement_list'),
    path('departements/<int:pk>/', views.departement_detail, name='departement_detail'),

    # ── Collaborateurs ───────────────────────────────────────────────────────
    path('collaborateurs/',          views.collaborateur_list,   name='collaborateur_list'),
    path('collaborateurs/<int:pk>/', views.collaborateur_detail, name='collaborateur_detail'),
]
