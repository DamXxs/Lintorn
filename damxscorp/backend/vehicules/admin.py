from django.contrib import admin
from .models import Vehicule


@admin.register(Vehicule)
class VehiculeAdmin(admin.ModelAdmin):
    """
    Configuration de l'interface admin pour les véhicules.
    """
    list_display = ('immatriculation', 'marque', 'modele', 'annee', 'proprietaire', 'date_creation')
    search_fields = ('immatriculation', 'marque', 'modele')
    list_filter = ('marque', 'annee', 'date_creation')
    ordering = ('marque', 'modele')