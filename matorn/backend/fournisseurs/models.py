# /backend/fournisseurs/models.py
from django.db import models

# IMPORT du Mixin et de l'exception depuis l'app archives
from mixins.models import SoftDeleteMixin, SuppressionBloqueeError


class Fournisseur(SoftDeleteMixin):  # ← MODIF : on hérite du Mixin au lieu de models.Model
    """
    Représente un fournisseur de pièces détachées.
    Chaque pièce en stock peut être liée à un fournisseur via une FK.
    Ce modèle sert aussi à générer les emails de commande automatiques
    quand le stock d'une pièce passe sous le seuil minimum.
    
    NOUVEAU : Hérite de SoftDeleteMixin, ce qui ajoute :
    - is_deleted, deleted_at (corbeille)
    - is_archived, archived_at (archives)
    - Méthodes soft_delete(), restore(), archive(), etc.
    """

    # Les catégories sont gérées dynamiquement via les Référentiels
    CATEGORIES_DEFAUT = [
        ('PNEUS',            'Pneumatiques'),
        ('PIECES_COMMUNES',  'Pièces communes'),
        ('PIECES_SPEC',      'Pièces spécifiques'),
        ('CARROSSERIE',      'Carrosserie'),
        ('ELECTRICITE',      'Électricité'),
        ('HUILES',           'Huiles & Liquides'),
        ('AUTRE',            'Autre'),
    ]

    nom = models.CharField(
        max_length=200,
        help_text="Nom de l'entreprise fournisseur (ex: Autodis, LKQ)"
    )
    email = models.EmailField(
        help_text="Email principal pour les commandes"
    )
    telephone = models.CharField(max_length=20, blank=True)
    contact_nom = models.CharField(max_length=200, blank=True)
    adresse = models.TextField(blank=True)
    categorie = models.CharField(
        max_length=50,
        blank=True,
        default='AUTRE',
        help_text="Catégorie du fournisseur — gérée via les Référentiels"
    )
    est_favori = models.BooleanField(default=False)
    actif = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    class Meta:
        ordering = ['nom']
        verbose_name = "Fournisseur"
        verbose_name_plural = "Fournisseurs"

    def __str__(self):
        return self.nom

    @property
    def pieces_en_alerte(self):
        """Retourne les pièces liées dont le stock est faible."""
        return self.pieces.filter(stock_actuel__lt=models.F('stock_minimum'))

    # =========================================================================
    # NOUVEAU : Règle métier pour la corbeille
    # =========================================================================
    def check_can_be_deleted(self):
        """
        On REFUSE la suppression si le fournisseur a encore des pièces actives liées.
        L'utilisateur doit d'abord réassigner ou supprimer ces pièces.
        
        Note : self.pieces utilise le manager par défaut "objects" du modèle Piece,
        qui filtre automatiquement les pièces non-supprimées et non-archivées.
        """
        # On compte les pièces ACTIVES liées à ce fournisseur
        pieces_actives = self.pieces.all()  # objects par défaut = actifs uniquement
        nb_pieces = pieces_actives.count()
        
        if nb_pieces > 0:
            # On construit la liste des éléments bloquants pour le frontend
            elements_bloquants = [
                {
                    'type': 'piece',
                    'id': p.id,
                    'reference': p.reference,
                    'nom': p.nom,
                    'stock_actuel': p.stock_actuel,
                }
                for p in pieces_actives[:10]  # max 10 pour ne pas surcharger l'UI
            ]
            
            # On lève l'exception qui sera attrapée par la vue
            raise SuppressionBloqueeError(
                message=(
                    f"Ce fournisseur a {nb_pieces} pièce(s) active(s) liée(s). "
                    f"Réassignez ou supprimez ces pièces avant de supprimer le fournisseur."
                ),
                elements_bloquants=elements_bloquants,
            )