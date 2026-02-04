from django.db import models
from clients.models import Client  # ← Import du modèle Client


# =============================================================================
# MODÈLE VÉHICULE
# =============================================================================
class Vehicule(models.Model):
    """
    Représente un véhicule.
    Un véhicule appartient à UN client (mais peut changer de propriétaire).
    """
    
    # Identification du véhicule
    immatriculation = models.CharField(
        max_length=20,
        unique=True,  # Pas 2 véhicules avec la même plaque !
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
    
    # RELATION avec Client (ForeignKey = clé étrangère)
    # null=True, blank=True = un véhicule peut temporairement ne pas avoir de proprio
    # on_delete=SET_NULL = si tu supprimes le client, le véhicule reste mais sans proprio
    proprietaire = models.ForeignKey(
        Client,  # ← Lien vers le modèle Client
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vehicules',  # Permet de faire client.vehicules.all()
        help_text="Propriétaire actuel du véhicule"
    )
    
    # Métadonnées
    date_creation = models.DateTimeField(
        auto_now_add=True,
        help_text="Date d'ajout du véhicule dans la base"
    )
    
    # Notes (pour infos spécifiques au véhicule)
    notes = models.TextField(
        blank=True,
        help_text="Notes sur le véhicule (ex: pneus neige l'hiver)"
    )
    
    class Meta:
        ordering = ['marque', 'modele']
        verbose_name = "Véhicule"
        verbose_name_plural = "Véhicules"
    
    def __str__(self):
        """
        Affichage : "Peugeot 308 (AB-123-CD)"
        """
        return f"{self.marque} {self.modele} ({self.immatriculation})"