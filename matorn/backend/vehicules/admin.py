# /backend/vehicules/admin.py
from django.contrib import admin
from .models import Vehicule
from archives.admin import SoftDeleteAdminMixin

@admin.register(Vehicule)
class VehiculeAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    """
    Configuration de l'affichage des véhicules dans l'admin Django
    """
    list_display = ['id', 'immatriculation', 'marque', 'modele', 'proprietaire']
    list_display_links = ['id', 'immatriculation']
    list_filter = ['marque']
    search_fields = ['immatriculation', 'marque', 'modele', 'proprietaire__nom']
    ordering = ['id']