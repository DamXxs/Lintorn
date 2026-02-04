from django.db import models


# =============================================================================
# MODÈLE PIÈCE
# =============================================================================
class Piece(models.Model):
    """
    Représente une pièce détachée en stock.
    """
    
    # CHOIX pour les catégories
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
    
    # Identification de la pièce
    reference = models.CharField(
        max_length=50,
        unique=True,
        help_text="Référence unique de la pièce (ex: FLT-OIL-001)"
    )
    nom = models.CharField(
        max_length=200,
        help_text="Nom de la pièce (ex: Filtre à huile)"
    )
    description = models.TextField(
        blank=True,
        help_text="Description détaillée (compatibilité, specs, etc.)"
    )
    
    # Catégorie
    categorie = models.CharField(
        max_length=20,
        choices=CATEGORIE_CHOICES,
        default='AUTRE',
        help_text="Catégorie de la pièce"
    )
    
    # Prix
    prix_achat = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Prix d'achat HT chez le fournisseur"
    )
    prix_vente = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Prix de vente TTC au client"
    )
    
    # Stock
    stock_actuel = models.IntegerField(
        default=0,
        help_text="Quantité actuellement en stock"
    )
    stock_minimum = models.IntegerField(
        default=5,
        help_text="Seuil d'alerte (si stock < seuil → alerte)"
    )
    
    # Fournisseur
    fournisseur = models.CharField(
        max_length=200,
        blank=True,
        help_text="Nom du fournisseur principal"
    )
    delai_livraison = models.IntegerField(
        default=2,
        help_text="Délai de livraison en jours"
    )
    
    # Métadonnées
    date_creation = models.DateTimeField(
        auto_now_add=True,
        help_text="Date d'ajout de la pièce dans le système"
    )
    date_modification = models.DateTimeField(
        auto_now=True,
        help_text="Dernière modification"
    )
    
    class Meta:
        ordering = ['categorie', 'nom']
        verbose_name = "Pièce"
        verbose_name_plural = "Pièces"
    
    def __str__(self):
        """
        Affichage : "FLT-OIL-001 - Filtre à huile"
        """
        return f"{self.reference} - {self.nom}"
    
    @property
    def stock_status(self):
        """
        Retourne le statut du stock : OK, ALERTE, ou RUPTURE
        """
        if self.stock_actuel == 0:
            return "RUPTURE"
        elif self.stock_actuel < self.stock_minimum:
            return "ALERTE"
        else:
            return "OK"
    
    @property
    def marge(self):
        """
        Calcule la marge en euros
        """
        return self.prix_vente - self.prix_achat
    
    @property
    def marge_pourcentage(self):
        """
        Calcule la marge en pourcentage
        """
        if self.prix_achat > 0:
            return ((self.prix_vente - self.prix_achat) / self.prix_achat) * 100
        return 0