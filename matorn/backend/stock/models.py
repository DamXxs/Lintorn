# /backend/stock/models.py
from django.db import models

# IMPORT du Mixin et de l'exception
from mixins.models import SoftDeleteMixin, SuppressionBloqueeError


class Piece(SoftDeleteMixin):  # ← MODIF : hérite du Mixin
    """
    Représente une pièce détachée en stock.
    
    NOUVEAU : Hérite de SoftDeleteMixin → corbeille + archives.
    """
    
    CATEGORIE_CHOICES = [
        ('FILTRATION', 'Filtration'),
        ('HUILES', 'Huiles & Liquides'),
        ('FREINAGE', 'Freinage'),
        ('PNEUMATIQUE', 'Pneumatiques'),
        ('ELECTRICITE', 'Électricité'),
        ('MECANIQUE', 'Mécanique'),
        ('CARROSSERIE', 'Carrosserie'),
        ('AUTRE', 'Autre'),
    ]
    
    reference = models.CharField(
        max_length=50,
        unique=True,
        help_text="Référence unique de la pièce (ex: FLT-OIL-001)"
    )
    nom = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    categorie = models.CharField(
        max_length=20,
        choices=CATEGORIE_CHOICES,
        default='AUTRE',
    )
    prix_achat = models.DecimalField(max_digits=10, decimal_places=2)
    prix_vente = models.DecimalField(max_digits=10, decimal_places=2)
    
    stock_actuel = models.IntegerField(default=0)
    stock_minimum = models.IntegerField(default=5)
    stock_suspendu = models.IntegerField(
        default=0,
        help_text="Quantité réservée pour des devis en cours"
    )
    
    fournisseur_ref = models.ForeignKey(
        'fournisseurs.Fournisseur',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pieces',
    )
    delai_livraison = models.IntegerField(default=2)
    
    class Meta:
        ordering = ['categorie', 'nom']
        verbose_name = "Pièce"
        verbose_name_plural = "Pièces"
    
    def __str__(self):
        return f"{self.reference} - {self.nom}"
    
    @property
    def stock_disponible(self):
        return max(0, self.stock_actuel - self.stock_suspendu)

    @property
    def stock_status(self):
        dispo = self.stock_disponible
        if dispo == 0:
            return "RUPTURE"
        elif dispo < self.stock_minimum:
            return "ALERTE"
        else:
            return "OK"
    
    @property
    def marge(self):
        if self.prix_vente is None or self.prix_achat is None:
            return 0
        return self.prix_vente - self.prix_achat
    
    @property
    def marge_pourcentage(self):
        if self.prix_achat is None or self.prix_vente is None or self.prix_achat <= 0:
            return 0
        return ((self.prix_vente - self.prix_achat) / self.prix_achat) * 100
    
    # =========================================================================
    # NOUVEAU : Règle métier pour la corbeille
    # =========================================================================
    def check_can_be_deleted(self):
        """
        On REFUSE la suppression si la pièce a du stock_suspendu > 0,
        c'est-à-dire si elle est utilisée dans un devis en cours.
        
        Pourquoi ? Si on supprime cette pièce, le devis aurait une ligne
        orpheline (piece=NULL) et le calcul du stock serait cassé.
        """
        if self.stock_suspendu > 0:
            # On va chercher les devis qui utilisent cette pièce
            # pour informer l'utilisateur précisément
            from factures.models import LigneDevis  # import local pour éviter circular
            
            lignes = LigneDevis.objects.filter(
                piece=self,
                devis__statut__in=['CREE', 'VALIDE']  # devis encore actifs
            ).select_related('devis__client')
            
            elements_bloquants = [
                {
                    'type': 'devis',
                    'id': l.devis.id,
                    'numero': l.devis.numero,
                    'client_nom': l.devis.client.nom,
                    'statut': l.devis.get_statut_display(),
                    'quantite_reservee': l.quantite,
                }
                for l in lignes
            ]
            
            raise SuppressionBloqueeError(
                message=(
                    f"Cette pièce est réservée par {len(elements_bloquants)} devis "
                    f"en cours ({self.stock_suspendu} unité(s) suspendue(s)). "
                    f"Refusez ou facturez les devis concernés avant de la supprimer."
                ),
                elements_bloquants=elements_bloquants,
            )