from django.contrib import admin
from .models import Client, Vehicule, Intervention, Piece, CommandeFournisseur, LigneCommande

# =============================================================================
# ADMIN CLIENT
# =============================================================================
@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour gérer les clients.
    """
    list_display = ['nom', 'prenom', 'telephone', 'email', 'date_creation']
    search_fields = ['nom', 'prenom', 'telephone', 'email']
    list_filter = ['date_creation']
    ordering = ['nom', 'prenom']


# =============================================================================
# ADMIN VÉHICULE
# =============================================================================
@admin.register(Vehicule)
class VehiculeAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour gérer les véhicules.
    """
    list_display = ['immatriculation', 'marque', 'modele', 'annee', 'proprietaire', 'date_creation']
    search_fields = ['immatriculation', 'marque', 'modele']
    list_filter = ['marque', 'annee', 'date_creation']
    ordering = ['marque', 'modele']


# =============================================================================
# ADMIN INTERVENTION
# =============================================================================
@admin.register(Intervention)
class InterventionAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour gérer les interventions.
    """
    # Colonnes affichées dans la liste (CORRIGÉ !)
    list_display = ['get_client_nom', 'get_vehicule_info', 'type_rdv', 'date_debut', 'statut', 'rappel_envoye']
    
    # Recherche
    search_fields = ['client__nom', 'client__prenom', 'vehicule__immatriculation', 'description']
    
    # Filtres
    list_filter = ['type_rdv', 'statut', 'date_debut', 'rappel_envoye']
    
    # Tri par date décroissante
    ordering = ['-date_debut']
    
    # Champs en lecture seule
    readonly_fields = ['date_creation', 'date_modification']
    
    # Organisation des champs dans le formulaire
    fieldsets = (
        ('Type de rendez-vous', {
            'fields': ('type_rdv',)
        }),
        ('Informations principales', {
            'fields': ('client', 'vehicule', 'date_debut', 'date_fin')
        }),
        ('Détails', {
            'fields': ('description', 'statut', 'rappel_envoye')
        }),
        ('Métadonnées', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )
    
    # =========================================================================
    # MÉTHODES PERSONNALISÉES (pour afficher correctement dans la liste)
    # =========================================================================
    
    def get_client_nom(self, obj):
        """
        Affiche le nom complet du client.
        """
        return f"{obj.client.nom} {obj.client.prenom}".strip()
    get_client_nom.short_description = "Client"  # Nom de la colonne
    get_client_nom.admin_order_field = "client__nom"  # Permet de trier par nom
    
    def get_vehicule_info(self, obj):
        """
        Affiche les infos du véhicule OU "Pas de véhicule" si ACADÉMIE.
        """
        if obj.vehicule:
            return f"{obj.vehicule.marque} {obj.vehicule.modele} ({obj.vehicule.immatriculation})"
        else:
            return "🎓 Pas de véhicule (Académie)"
    get_vehicule_info.short_description = "Véhicule"

# =============================================================================
# ADMIN PIÈCE
# =============================================================================
@admin.register(Piece)
class PieceAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour gérer les pièces.
    """
    list_display = ['reference', 'nom', 'categorie', 'stock_actuel', 'stock_minimum', 'stock_status', 'prix_achat', 'prix_vente']
    search_fields = ['reference', 'nom', 'fournisseur']
    list_filter = ['categorie', 'fournisseur']
    ordering = ['categorie', 'nom']
    
    # Méthode pour afficher le statut du stock avec couleur
    def stock_status(self, obj):
        status = obj.stock_status
        colors = {
            'OK': 'green',
            'ALERTE': 'orange',
            'RUPTURE': 'red'
        }
        return f'<span style="color: {colors[status]}; font-weight: bold;">{status}</span>'
    stock_status.short_description = "Statut Stock"
    stock_status.allow_tags = True

# =============================================================================
# ADMIN COMMANDE FOURNISSEUR
# =============================================================================
class LigneCommandeInline(admin.TabularInline):
    """
    Permet d'ajouter des lignes de commande directement depuis la commande.
    """
    model = LigneCommande
    extra = 1
    fields = ['piece', 'quantite', 'prix_unitaire']


@admin.register(CommandeFournisseur)
class CommandeFournisseurAdmin(admin.ModelAdmin):
    """
    Interface d'administration pour gérer les commandes fournisseurs.
    """
    list_display = ['numero_commande', 'fournisseur', 'date_commande', 'statut', 'date_livraison_prevue']
    search_fields = ['numero_commande', 'fournisseur']
    list_filter = ['statut', 'date_commande']
    ordering = ['-date_commande']
    
    # Affiche les lignes de commande dans le formulaire
    inlines = [LigneCommandeInline]