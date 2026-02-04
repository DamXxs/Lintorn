from django.contrib import admin
from .models import Intervention


@admin.register(Intervention)
class InterventionAdmin(admin.ModelAdmin):
    """
    Configuration de l'interface admin pour les interventions.
    """
    list_display = ('client', 'vehicule', 'type_rdv', 'date_debut', 'statut', 'date_creation')
    search_fields = ('client__nom', 'vehicule__immatriculation', 'description')
    list_filter = ('type_rdv', 'statut', 'date_debut', 'date_creation')
    ordering = ('-date_debut',)