# /backend/referentiels/models.py
from django.db import models


class Referentiel(models.Model):
    """
    Modèle générique pour tous les référentiels configurables.
    Une seule table pour : types de véhicules, types d'interventions,
    catégories de stock — extensible à volonté.
    """

    # Catégories disponibles
    CATEGORIE_CHOICES = [
        ('TYPE_VEHICULE',       'Types de véhicules'),
        ('TYPE_INTERVENTION',   'Types d\'interventions'),
        ('CATEGORIE_STOCK',     'Catégories de stock'),
        ('CATEGORIE_FOURNISSEUR', 'Catégories de fournisseurs'),
    ]

    categorie = models.CharField(
        max_length=30,
        choices=CATEGORIE_CHOICES,
        help_text="Catégorie du référentiel"
    )

    # Clé interne — utilisée dans le code et les FK
    # Ex: "VOITURE", "BATEAU" — ne devrait pas changer après création
    valeur = models.CharField(
        max_length=50,
        help_text="Clé interne (ex: VOITURE, BATEAU)"
    )

    # Label affiché à l'utilisateur — modifiable librement
    label = models.CharField(
        max_length=100,
        help_text="Libellé affiché (ex: Voiture, Bateau)"
    )

    # Nom de l'icône (catalogue iconUtils.js côté frontend)
    icone = models.CharField(
        max_length=50,
        blank=True,
        default='',
        help_text="Nom de l'icône (ex: Car, Wrench, AlertTriangle)"
    )

    # Couleur hex (utile pour les types d'intervention dans le calendrier)
    couleur = models.CharField(
        max_length=20,
        blank=True,
        default='',
        help_text="Couleur hex (ex: #2980b9)"
    )

    # Ordre d'affichage — boutons ▲▼ dans l'interface
    ordre = models.IntegerField(
        default=0,
        help_text="Ordre d'affichage"
    )

    # Actif/inactif — désactiver sans supprimer
    actif = models.BooleanField(
        default=True,
        help_text="Visible dans les listes si True"
    )

    class Meta:
        # Chaque valeur est unique par catégorie
        unique_together = [('categorie', 'valeur')]
        ordering = ['categorie', 'ordre', 'label']
        verbose_name = "Référentiel"
        verbose_name_plural = "Référentiels"

    def __str__(self):
        return f"[{self.categorie}] {self.label}"
    
    # =============================================================================
    # PROXY MODELS — pour avoir des admins dédiés par catégorie
    # =============================================================================
    # Un proxy model ne crée PAS de nouvelle table en BDD.
    # C'est juste un "alias" qui filtre automatiquement les requêtes.

class TypeInterventionManager(models.Manager):
    """Manager qui filtre uniquement les Référentiels de type TYPE_INTERVENTION."""
    def get_queryset(self):
        return super().get_queryset().filter(categorie='TYPE_INTERVENTION')


class TypeIntervention(Referentiel):
    """
    Proxy vers Referentiel filtré sur categorie='TYPE_INTERVENTION'.
    Permet d'avoir un admin dédié et un autocomplete propre.
    """
    objects = TypeInterventionManager()
    
class Meta:
    proxy = True  # ← pas de nouvelle table en BDD
    verbose_name = "Type d'intervention"
    verbose_name_plural = "Types d'intervention"
    base_manager_name = 'objects'
    
    def save(self, *args, **kwargs):
        # On force la catégorie à TYPE_INTERVENTION lors de la sauvegarde
        self.categorie = 'TYPE_INTERVENTION'
        super().save(*args, **kwargs)