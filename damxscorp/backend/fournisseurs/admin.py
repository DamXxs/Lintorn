from django.contrib import admin
from .models import CommandeFournisseur, LigneCommande


class LigneCommandeInline(admin.TabularInline):
    """
    Permet d'ajouter/modifier les lignes de commande directement depuis la commande.
    """
    model = LigneCommande
    extra = 1  # Nombre de lignes vides à afficher
    fields = ('piece', 'quantite', 'prix_unitaire')


@admin.register(CommandeFournisseur)
class CommandeFournisseurAdmin(admin.ModelAdmin):
    """
    Configuration de l'interface admin pour les commandes fournisseurs.
    """
    list_display = ('numero_commande', 'fournisseur', 'date_commande', 'statut', 'date_livraison_prevue')
    search_fields = ('numero_commande', 'fournisseur')
    list_filter = ('statut', 'date_commande', 'date_creation')
    ordering = ('-date_commande',)
    inlines = [LigneCommandeInline]  # Affiche les lignes de commande


@admin.register(LigneCommande)
class LigneCommandeAdmin(admin.ModelAdmin):
    """
    Configuration de l'interface admin pour les lignes de commande.
    """
    list_display = ('commande', 'piece', 'quantite', 'prix_unitaire', 'total')
    search_fields = ('commande__numero_commande', 'piece__nom')
    list_filter = ('commande__statut',)