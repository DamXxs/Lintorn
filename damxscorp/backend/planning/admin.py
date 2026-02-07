# /backend/planning/admin.py
from django.contrib import admin
from .models import Intervention

@admin.register(Intervention)
class InterventionAdmin(admin.ModelAdmin):
    """
    Configuration de l'affichage des interventions dans l'admin Django
    """
    list_display = ['id', 'type_rdv', 'client', 'vehicule', 'date_debut', 'statut']
    list_display_links = ['id']
    list_filter = ['type_rdv', 'statut', 'date_debut']
    search_fields = ['client__nom', 'vehicule__immatriculation', 'description']
    ordering = ['-date_debut']
    
    # Champs en lecture seule
    readonly_fields = ['date_creation', 'date_modification']