# /backend/planning/models.py
from django.db import models

from clients.models import Client
from vehicules.models import Vehicule

# IMPORT du Mixin et de l'exception (UNIQUEMENT pour Intervention)
from mixins.models import SoftDeleteMixin, SuppressionBloqueeError


# =============================================================================
# MODÈLE DÉPARTEMENT  (INCHANGÉ — config, pas de soft-delete)
# =============================================================================
class Departement(models.Model):
    code = models.CharField(
        max_length=30,
        unique=True,
        help_text="Identifiant technique unique, ex: ATELIER, ACADEMIE"
    )
    nom = models.CharField(
        max_length=100,
        help_text="Nom affiché dans l'interface, ex: Atelier, Académie"
    )
    couleur = models.CharField(
        max_length=7,
        default='#2980b9',
        help_text="Couleur hex affichée dans le planning, ex: #2980b9"
    )
    actif = models.BooleanField(
        default=True,
        help_text="Si désactivé, ce département n'apparaît plus dans les formulaires"
    )
    ordre = models.PositiveIntegerField(
        default=0,
        help_text="Ordre d'affichage (0 = en premier)"
    )
    requiert_vehicule = models.BooleanField(
        default=True,
        help_text="Si True, le champ véhicule est demandé dans le formulaire de RDV"
    )

    class Meta:
        ordering = ['ordre', 'nom']
        verbose_name = "Département"
        verbose_name_plural = "Départements"

    def __str__(self):
        return f"{self.nom} ({'actif' if self.actif else 'inactif'})"


# =============================================================================
# MODÈLE COLLABORATEUR  (INCHANGÉ — config, pas de soft-delete)
# =============================================================================
class Collaborateur(models.Model):
    nom = models.CharField(
        max_length=100,
        help_text="Nom complet du collaborateur, ex: Thomas Dupont"
    )
    couleur = models.CharField(
        max_length=7,
        default='#27ae60',
        help_text="Couleur hex affichée dans le planning, ex: #27ae60"
    )
    role = models.CharField(
        max_length=100,
        blank=True,
        help_text="Rôle dans le garage, ex: Mécanicien, Formateur"
    )
    actif = models.BooleanField(
        default=True,
        help_text="Si désactivé, ce collaborateur n'apparaît plus dans les plannings"
    )

    class Meta:
        ordering = ['nom']
        verbose_name = "Collaborateur"
        verbose_name_plural = "Collaborateurs"

    def __str__(self):
        return self.nom


# =============================================================================
# MODÈLE INTERVENTION  (MODIFIÉ : hérite de SoftDeleteMixin)
# =============================================================================
class Intervention(SoftDeleteMixin):  # ← MODIF

    STATUT_CHOICES = [
        ('PLANIFIE',    'Planifié'),
        ('RECEPTIONNE', 'Réceptionné'),
        ('EN_COURS',    'En cours'),
        ('TERMINE',     'Terminé'),
        ('ANNULE',      'Annulé'),
    ]

    departement = models.ForeignKey(
        Departement,
        on_delete=models.PROTECT,
        related_name='interventions',
        null=True,
        blank=True,
        help_text="Département concerné (ex: Atelier, Académie)"
    )

    collaborateurs = models.ManyToManyField(
        Collaborateur,
        blank=True,
        related_name='interventions',
        help_text="Collaborateur(s) assigné(s) à cette intervention"
    )

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='interventions',
    )

    vehicule = models.ForeignKey(
        Vehicule,
        on_delete=models.CASCADE,
        related_name='interventions',
        null=True,
        blank=True,
    )

    date_debut = models.DateTimeField()
    date_fin   = models.DateTimeField(null=True, blank=True)

    description = models.TextField(blank=True)

    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='PLANIFIE',
    )

    rappel_envoye = models.BooleanField(default=False)

    class Meta:
        ordering = ['-date_debut']
        verbose_name = "Intervention"
        verbose_name_plural = "Interventions"

    def __str__(self):
        dept = self.departement.nom if self.departement else '?'
        if self.vehicule:
            return f"{self.client} - {self.vehicule.modele} - {self.date_debut.strftime('%d/%m/%Y')}"
        return f"{self.client} - {dept} - {self.date_debut.strftime('%d/%m/%Y')}"

    @property
    def titre_calendrier(self):
        if self.vehicule:
            return f"{self.client.nom} - {self.vehicule.modele}"
        dept = self.departement.nom if self.departement else ''
        return f"{self.client.nom} - {dept}"
    
    # =========================================================================
    # NOUVEAU : Règle métier pour la corbeille
    # =========================================================================
    def check_can_be_deleted(self):
        """
        On REFUSE la suppression d'un RDV s'il est lié à une facture émise.
        
        Pourquoi ? Si une facture a été générée à partir de ce RDV, supprimer
        le RDV ferait perdre la traçabilité comptable.
        
        Note : on autorise la suppression même si EN_COURS ou TERMINE,
        car on peut vouloir corriger une erreur de saisie.
        """
        # On vérifie s'il y a des factures liées (active uniquement)
        factures_liees = self.factures.all()  # objects par défaut
        
        nb_factures = factures_liees.count()
        
        if nb_factures > 0:
            elements_bloquants = [
                {
                    'type': 'facture',
                    'id': f.id,
                    'numero': f.numero,
                    'montant_ttc': float(f.montant_ttc),
                    'statut': f.get_statut_display(),
                }
                for f in factures_liees[:10]
            ]
            
            raise SuppressionBloqueeError(
                message=(
                    f"Ce rendez-vous est lié à {nb_factures} facture(s). "
                    f"Supprimer le RDV briserait la traçabilité comptable."
                ),
                elements_bloquants=elements_bloquants,
            )