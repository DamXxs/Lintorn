# /backend/planning/admin.py
from django.contrib import admin
from .models import Intervention, Departement, Collaborateur
from archives.admin import SoftDeleteAdminMixin


@admin.register(Departement)
class DepartementAdmin(admin.ModelAdmin):
    list_display  = ['id', 'code', 'nom', 'couleur', 'actif', 'ordre', 'requiert_vehicule']
    list_filter   = ['actif', 'requiert_vehicule']
    search_fields = ['code', 'nom']
    ordering      = ['ordre', 'nom']


@admin.register(Collaborateur)
class CollaborateurAdmin(admin.ModelAdmin):
    list_display  = ['id', 'nom', 'role', 'couleur', 'actif']
    list_filter   = ['actif']
    search_fields = ['nom', 'role']


@admin.register(Intervention)
class InterventionAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    list_display       = ['id', 'departement', 'client', 'vehicule', 'date_debut', 'statut']
    list_display_links = ['id']
    list_filter        = ['departement', 'statut', 'date_debut']
    search_fields      = ['client__nom', 'vehicule__immatriculation', 'description']
    ordering           = ['-date_debut']
    readonly_fields    = ['created_at', 'updated_at']