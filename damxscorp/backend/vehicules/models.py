from django.db import models
from clients.models import Client


# =============================================================================
# MODÈLE VÉHICULE
# =============================================================================
class Vehicule(models.Model):
    """
    Représente un véhicule.
    Un véhicule appartient à UN client (mais peut changer de propriétaire).
    """

    # CHOIX pour le type de véhicule
    TYPE_CHOICES = [
        ('VOITURE',     'Voiture'),
        ('MOTO',        'Moto'),
        ('MOTOCULTURE', 'Motoculture'),
        ('BATEAU',      'Bateau'),
    ]

    # Identification du véhicule
    immatriculation = models.CharField(
        max_length=20,
        unique=True,
        help_text="Plaque d'immatriculation (ex: AB-123-CD)"
    )
    marque = models.CharField(
        max_length=50,
        help_text="Marque du véhicule (ex: Peugeot, Renault)"
    )
    modele = models.CharField(
        max_length=50,
        help_text="Modèle du véhicule (ex: 308, Clio)"
    )
    annee = models.IntegerField(
        null=True,
        blank=True,
        help_text="Année de mise en circulation"
    )

    # ← NOUVEAU : type de véhicule (voiture, moto, etc.)
    type_vehicule = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='VOITURE',
        help_text="Type de véhicule (Voiture, Moto, Motoculture, Bateau)"
    )

    # RELATION avec Client
    proprietaire = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vehicules',
        help_text="Propriétaire actuel du véhicule"
    )

    # Métadonnées
    date_creation = models.DateTimeField(
        auto_now_add=True,
        help_text="Date d'ajout du véhicule dans la base"
    )

    # Notes
    notes = models.TextField(
        blank=True,
        help_text="Notes sur le véhicule (ex: pneus neige l'hiver)"
    )

    class Meta:
        ordering = ['marque', 'modele']
        verbose_name = "Véhicule"
        verbose_name_plural = "Véhicules"

    def __str__(self):
        return f"{self.marque} {self.modele} ({self.immatriculation})"