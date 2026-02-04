from django.db import models
from stock.models import Piece  # ← Import du modèle Piece


# =============================================================================
# MODÈLE COMMANDE FOURNISSEUR
# =============================================================================
class CommandeFournisseur(models.Model):
    """
    Représente une commande passée auprès d'un fournisseur.
    """
    
    # CHOIX pour le statut
    STATUT_CHOICES = [
        ('BROUILLON', 'Brouillon'),
        ('ENVOYEE', 'Envoyée'),
        ('EN_ATTENTE', 'En attente de livraison'),
        ('LIVREE', 'Livrée'),
        ('ANNULEE', 'Annulée'),
    ]
    
    # Informations de base
    numero_commande = models.CharField(
        max_length=50,
        unique=True,
        help_text="Numéro de commande (ex: CMD-2026-001)"
    )
    fournisseur = models.CharField(
        max_length=200,
        help_text="Nom du fournisseur"
    )
    
    # Dates
    date_commande = models.DateField(
        help_text="Date de la commande"
    )
    date_livraison_prevue = models.DateField(
        null=True,
        blank=True,
        help_text="Date de livraison prévue"
    )
    date_livraison_reelle = models.DateField(
        null=True,
        blank=True,
        help_text="Date de livraison réelle"
    )
    
    # Statut
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='BROUILLON',
        help_text="État de la commande"
    )
    
    # Notes
    notes = models.TextField(
        blank=True,
        help_text="Notes ou commentaires sur la commande"
    )
    
    # Métadonnées
    date_creation = models.DateTimeField(
        auto_now_add=True,
        help_text="Date de création de la commande"
    )
    date_modification = models.DateTimeField(
        auto_now=True,
        help_text="Dernière modification"
    )
    
    class Meta:
        ordering = ['-date_commande']
        verbose_name = "Commande Fournisseur"
        verbose_name_plural = "Commandes Fournisseurs"
    
    def __str__(self):
        """
        Affichage : "CMD-2026-001 - Garage Center - Envoyée"
        """
        return f"{self.numero_commande} - {self.fournisseur} - {self.get_statut_display()}"


# =============================================================================
# MODÈLE LIGNE DE COMMANDE (pour lier Commande ↔ Pièce)
# =============================================================================
class LigneCommande(models.Model):
    """
    Représente une ligne dans une commande (1 pièce + quantité).
    """
    
    # Relations
    commande = models.ForeignKey(
        CommandeFournisseur,
        on_delete=models.CASCADE,
        related_name='lignes',
        help_text="Commande à laquelle appartient cette ligne"
    )
    piece = models.ForeignKey(
        Piece,  # ← Lien vers le modèle Piece
        on_delete=models.CASCADE,
        help_text="Pièce commandée"
    )
    
    # Quantité
    quantite = models.IntegerField(
        default=1,
        help_text="Quantité commandée"
    )
    
    # Prix au moment de la commande (peut être différent du prix actuel)
    prix_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Prix unitaire au moment de la commande"
    )
    
    class Meta:
        verbose_name = "Ligne de commande"
        verbose_name_plural = "Lignes de commande"
    
    def __str__(self):
        return f"{self.piece.nom} x{self.quantite}"
    
    @property
    def total(self):
        """
        Calcule le total de la ligne (quantité × prix unitaire)
        """
        return self.quantite * self.prix_unitaire