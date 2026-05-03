# /backend/clients/admin.py
from django.contrib import admin
from .models import Client

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """
    Configuration de l'affichage des clients dans l'admin Django
    """
    # Colonnes affichées dans la liste
    list_display = ['id', 'nom', 'prenom', 'email', 'telephone']
    
    # Champs cliquables pour éditer
    list_display_links = ['id', 'nom']
    
    # Filtres sur le côté
    list_filter = ['date_creation']
    
    # Barre de recherche
    search_fields = ['nom', 'prenom', 'email', 'telephone']
    
    # Ordre par défaut
    ordering = ['id']