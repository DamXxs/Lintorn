from django.db import models
from clients.models import Client      # ← Import du modèle Client
from vehicules.models import Vehicule  # ← Import du modèle Vehicule


# =============================================================================
# MODÈLE INTERVENTION
# =============================================================================
class Intervention(models.Model):
    """
    Représente un rendez-vous / intervention dans le planning.
    """
    # CHOIX pour le type de RDV
    TYPE_CHOICES = [
        ('ATELIER', 'Atelier (Mécanique)'),
        ('ACADEMIE', 'Académie (Cours)'),
    ]

    # CHOIX pour le statut
    STATUT_CHOICES = [
        ('PLANIFIE', 'Planifié'),
        ('EN_COURS', 'En cours'),
        ('TERMINE', 'Terminé'),
        ('ANNULE', 'Annulé'),
    ]
    
    # Type de RDV
    type_rdv = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='ATELIER',
        help_text="Type de rendez-vous (Atelier ou Académie)"
    )

    # RELATIONS (les liens vers Client et Véhicule)
    client = models.ForeignKey(
        Client,  # ← Lien vers le modèle Client
        on_delete=models.CASCADE,  # Si tu supprimes le client, ses rdv disparaissent
        related_name='interventions',
        help_text="Client concerné par cette intervention"
    )
    vehicule = models.ForeignKey(
        Vehicule,  # ← Lien vers le modèle Vehicule
        on_delete=models.CASCADE,  # Si tu supprimes le véhicule, ses rdv disparaissent
        related_name='interventions',
        help_text="Véhicule concerné par cette intervention",
        null=True,
        blank=True
    )
    
    # Date et heure
    date_debut = models.DateTimeField(
        help_text="Date et heure du début de l'intervention"
    )
    date_fin = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Date et heure de fin (optionnel, peut être calculé)"
    )
    
    # Description de l'intervention
    description = models.TextField(
        blank=True,
        help_text="Travaux à effectuer (ex: Vidange + filtre à huile)"
    )
    
    # Statut
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='PLANIFIE',
        help_text="État actuel de l'intervention"
    )
    
    # Rappel (pour ton système de notifications)
    rappel_envoye = models.BooleanField(
        default=False,
        help_text="True si le rappel a déjà été envoyé"
    )
    
    # Métadonnées
    date_creation = models.DateTimeField(
        auto_now_add=True,
        help_text="Date de création du rendez-vous"
    )
    date_modification = models.DateTimeField(
        auto_now=True,  # Se met à jour automatiquement à chaque sauvegarde
        help_text="Dernière modification"
    )
    
    class Meta:
        ordering = ['-date_debut']  # Tri par date décroissante (plus récent en premier)
        verbose_name = "Intervention"
        verbose_name_plural = "Interventions"
    
    def __str__(self):
        """
        Affichage : "Dupont Jean - Peugeot 308 - 25/01/2025"
        OU "Dupont Jean - Académie - 25/01/2025" si pas de véhicule
        """
        if self.vehicule:
            return f"{self.client} - {self.vehicule.modele} - {self.date_debut.strftime('%d/%m/%Y')}"
        else:
            return f"{self.client} - {self.type_rdv} - {self.date_debut.strftime('%d/%m/%Y')}"
        
    @property
    def titre_calendrier(self):
        """
        Propriété calculée pour l'affichage dans FullCalendar.
        """
        if self.vehicule:
            return f"{self.client.nom} - {self.vehicule.modele}"
        else:
            return f"{self.client.nom} - {self.type_rdv}"