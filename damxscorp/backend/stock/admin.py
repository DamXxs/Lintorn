from django.contrib import admin
from .models import Piece


@admin.register(Piece)
class PieceAdmin(admin.ModelAdmin):
    """
    Configuration de l'interface admin pour les pièces.
    """
    list_display = ('reference', 'nom', 'categorie', 'stock_actuel', 'stock_minimum', 'prix_achat', 'prix_vente')
    search_fields = ('reference', 'nom', 'fournisseur')
    list_filter = ('categorie', 'date_creation')
    ordering = ('categorie', 'nom')
    
    def get_readonly_fields(self, request, obj=None):
        """
        Affiche les propriétés calculées en lecture seule.
        """
        if obj:
            return self.readonly_fields + ('stock_status', 'marge', 'marge_pourcentage')
        return self.readonly_fields