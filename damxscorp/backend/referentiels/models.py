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
        ('TYPE_VEHICULE',      'Types de véhicules'),
        ('TYPE_INTERVENTION',  'Types d\'interventions'),
        ('CATEGORIE_STOCK',    'Catégories de stock'),
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

    # Icône emoji
    icone = models.CharField(
        max_length=10,
        blank=True,
        default='',
        help_text="Icône emoji (ex: 🚗)"
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