from django.db import models
from clients.models import Client
from vehicules.models import Vehicule


# =============================================================================
# MODÈLE DÉPARTEMENT
# Remplace le champ type_rdv hardcodé (ATELIER / ACADEMIE).
# Maintenant chaque département est géré dynamiquement depuis les Paramètres.
# =============================================================================
class Departement(models.Model):
    # Le CODE est l'identifiant technique (ex: 'ATELIER', 'ACADEMIE', 'CARROSSERIE')
    # Il sert à la compatibilité avec l'existant et aux éventuels tests côté code
    code = models.CharField(
        max_length=30,
        unique=True,
        help_text="Identifiant technique unique, ex: ATELIER, ACADEMIE"
    )

    # Le NOM est ce que voit l'utilisateur dans l'interface
    nom = models.CharField(
        max_length=100,
        help_text="Nom affiché dans l'interface, ex: Atelier, Académie"
    )

    # La COULEUR est utilisée dans le calendrier planning (format hex)
    couleur = models.CharField(
        max_length=7,
        default='#2980b9',
        help_text="Couleur hex affichée dans le planning, ex: #2980b9"
    )

    # ACTIF : si False, le département n'apparaît plus dans le formulaire de RDV
    actif = models.BooleanField(
        default=True,
        help_text="Si désactivé, ce département n'apparaît plus dans les formulaires"
    )

    # ORDRE : pour trier les départements dans le formulaire
    ordre = models.PositiveIntegerField(
        default=0,
        help_text="Ordre d'affichage (0 = en premier)"
    )

    # REQUIERT_VEHICULE : si True, la section véhicule s'affiche dans ModalForm
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
# MODÈLE COLLABORATEUR
# Représente un membre de l'équipe du garage.
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
# MODÈLE INTERVENTION
# =============================================================================
class Intervention(models.Model):

    STATUT_CHOICES = [
        ('PLANIFIE', 'Planifié'),
        ('EN_COURS', 'En cours'),
        ('TERMINE', 'Terminé'),
        ('ANNULE', 'Annulé'),
    ]

    # ── DÉPARTEMENT ─────────────────────────────────────────────────────────
    # Remplace l'ancien champ type_rdv hardcodé.
    # PROTECT : impossible de supprimer un département qui a des interventions.
    departement = models.ForeignKey(
        Departement,
        on_delete=models.PROTECT,
        related_name='interventions',
        null=True,
        blank=True,
        help_text="Département concerné (ex: Atelier, Académie)"
    )

    # ── COLLABORATEURS ───────────────────────────────────────────────────────
    # ManyToMany : un RDV peut avoir 0, 1 ou plusieurs collaborateurs.
    collaborateurs = models.ManyToManyField(
        Collaborateur,
        blank=True,
        related_name='interventions',
        help_text="Collaborateur(s) assigné(s) à cette intervention"
    )

    # ── CLIENT / VÉHICULE ────────────────────────────────────────────────────
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

    # ── DATES ────────────────────────────────────────────────────────────────
    date_debut = models.DateTimeField()
    date_fin   = models.DateTimeField(null=True, blank=True)

    # ── CONTENU ──────────────────────────────────────────────────────────────
    description = models.TextField(blank=True)

    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='PLANIFIE',
    )

    rappel_envoye = models.BooleanField(default=False)

    # ── MÉTADONNÉES ──────────────────────────────────────────────────────────
    date_creation     = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

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
