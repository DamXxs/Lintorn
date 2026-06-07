# /backend/vehicules/models.py
from django.db import models
from django.utils import timezone

from clients.models import Client

# IMPORT du Mixin et de l'exception
from mixins.models import SoftDeleteMixin, SuppressionBloqueeError


class Vehicule(SoftDeleteMixin):  # ← MODIF : hérite du Mixin
    """
    Représente un véhicule.
    Un véhicule appartient à UN client (mais peut changer de propriétaire).
    
    NOUVEAU : Hérite de SoftDeleteMixin → corbeille + archives.
    """

    TYPE_CHOICES = [
        ('VOITURE',     'Voiture'),
        ('MOTO',        'Moto'),
        ('MOTOCULTURE', 'Motoculture'),
        ('BATEAU',      'Bateau'),
    ]

    immatriculation = models.CharField(
        max_length=20,
        unique=True,
        help_text="Plaque d'immatriculation (ex: AB-123-CD)"
    )
    marque = models.CharField(max_length=50)
    modele = models.CharField(max_length=50)
    annee = models.IntegerField(null=True, blank=True)
    vin   = models.CharField(
        max_length=17,
        blank=True,
        null=True,
        help_text="Numéro de châssis (VIN — Vehicle Identification Number)"
    )

    type_vehicule = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='VOITURE',
    )

    proprietaire = models.ForeignKey(
        Client,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vehicules',
    )

    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['marque', 'modele']
        verbose_name = "Véhicule"
        verbose_name_plural = "Véhicules"

    def __str__(self):
        return f"{self.marque} {self.modele} ({self.immatriculation})"
    
    # =========================================================================
    # NOUVEAU : Règle métier pour la corbeille
    # =========================================================================
    def check_can_be_deleted(self):
        """
        On REFUSE la suppression si le véhicule a des RDV à venir
        (date_debut >= maintenant) ET qui ne sont pas annulés.
        """
        # Filtrer les RDV à venir et non annulés
        rdv_a_venir = self.interventions.filter(
            date_debut__gte=timezone.now(),
        ).exclude(
            statut='ANNULE'
        ).select_related('client', 'departement')
        
        nb_rdv = rdv_a_venir.count()
        
        if nb_rdv > 0:
            elements_bloquants = [
                {
                    'type': 'rdv',
                    'id': rdv.id,
                    'date_debut': rdv.date_debut.isoformat(),
                    'description': rdv.description or '(sans description)',
                    'statut': rdv.get_statut_display(),
                    'client_nom': rdv.client.nom,
                }
                for rdv in rdv_a_venir[:10]
            ]
            
            raise SuppressionBloqueeError(
                message=(
                    f"Ce véhicule a {nb_rdv} rendez-vous à venir. "
                    f"Annulez ou terminez ces RDV avant de supprimer le véhicule."
                ),
                elements_bloquants=elements_bloquants,
            )