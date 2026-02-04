from django.contrib import admin
from .models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """
    Configuration de l'interface admin pour les clients.
    """
    list_display = ('nom', 'prenom', 'telephone', 'email', 'date_creation')
    search_fields = ('nom', 'prenom', 'email', 'telephone')
    list_filter = ('date_creation',)
    ordering = ('nom', 'prenom')