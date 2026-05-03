# /backend/fournisseurs/admin.py
from django.contrib import admin
from .models import Fournisseur
from archives.admin import SoftDeleteAdminMixin

@admin.register(Fournisseur)
class FournisseurAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    list_display  = ['id', 'nom', 'email', 'telephone', 'actif', 'nb_pieces_display']
    list_filter   = ['actif']
    search_fields = ['nom', 'email', 'contact_nom']
    ordering      = ['nom']

    def nb_pieces_display(self, obj):
        return obj.pieces.count()
    nb_pieces_display.short_description = 'Nb pièces'