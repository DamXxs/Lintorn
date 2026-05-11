# /backend/ordres_reparation/models.py

from django.db import models
from datetime import date

# Import du Mixin pour la cohérence avec le reste du projet
from archives.models import SoftDeleteMixin, SuppressionBloqueeError


# ============================================================
# MODÈLE PRINCIPAL : ORDRE DE RÉPARATION
# ============================================================
class OrdreReparation(SoftDeleteMixin):
    """
    Document atelier interne (≠ facture).
    Trace le travail effectué sur un véhicule/engin.
    Hérite de SoftDeleteMixin → corbeille + archives.
    """
    
    STATUT_OUVERT = 'OUVERT'
    STATUT_EN_COURS = 'EN_COURS'
    STATUT_CLOTURE = 'CLOTURE'
    STATUT_ANNULE = 'ANNULE'
    
    STATUT_CHOICES = [
        (STATUT_OUVERT, 'Ouvert'),
        (STATUT_EN_COURS, 'En cours'),
        (STATUT_CLOTURE, 'Clôturé'),
        (STATUT_ANNULE, 'Annulé'),
    ]
    
    # === Identification ===
    numero = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        help_text="Format OR-AAAA-0001, reset chaque année"
    )
    
    date_ouverture = models.DateField(
        default=date.today,
        help_text="Date de création de l'OR"
    )
    
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default=STATUT_OUVERT
    )
    
    # === Relations vers les modules existants ===
    # ✅ Noms corrigés selon ton backend
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.PROTECT,
        related_name='ordres_reparation'
    )
    
    vehicule = models.ForeignKey(
        'vehicules.Vehicule',
        on_delete=models.PROTECT,
        related_name='ordres_reparation'
    )
    
    # ✅ CORRIGÉ : Intervention au lieu de RendezVous
    rdv = models.ForeignKey(
        'planning.Intervention',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='ordres_reparation',
        help_text="RDV qui a généré l'OR (optionnel)"
    )
    
    # === Données saisies ===
    kilometrage_entree = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Km ou heures moteur à l'entrée"
    )
    
    description_travaux = models.TextField(
        blank=True,
        help_text="Description initiale (peut venir du motif du RDV)"
    )
    
    # === Clôture ===
    date_cloture = models.DateField(null=True, blank=True)
    kilometrage_sortie = models.PositiveIntegerField(null=True, blank=True)
    heure_sortie = models.TimeField(null=True, blank=True)
    
    notes_internes = models.TextField(
        blank=True,
        help_text="Notes du mécanicien, non imprimées sur l'OR"
    )
    
    # === Timestamps ===
    cree_le = models.DateTimeField(auto_now_add=True)
    modifie_le = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Ordre de réparation"
        verbose_name_plural = "Ordres de réparation"
        ordering = ['-date_ouverture', '-numero']
    
    def __str__(self):
        return f"{self.numero} — {self.client} ({self.vehicule})"
    
    def save(self, *args, **kwargs):
        """Génère le numéro OR-AAAA-0001 à la création."""
        if not self.numero:
            annee = self.date_ouverture.year
            # IMPORTANT : on utilise all_objects pour inclure les OR soft-deleted
            # → évite les doublons de numéros si on a supprimé des OR
            dernier = OrdreReparation.all_objects.filter(
                numero__startswith=f"OR-{annee}-"
            ).order_by('-numero').first()
            
            if dernier:
                dernier_num = int(dernier.numero.split('-')[-1])
                nouveau_num = dernier_num + 1
            else:
                nouveau_num = 1
            
            self.numero = f"OR-{annee}-{nouveau_num:04d}"
        
        super().save(*args, **kwargs)
    
    # === Méthodes utilitaires ===
    def duree_totale_minutes(self):
        """Somme des durées de toutes les interventions, en minutes."""
        return sum(
            interv.duree_minutes for interv in self.interventions.all()
        )
    
    def nombre_pieces(self):
        """Nombre total de pièces utilisées."""
        return sum(p.quantite for p in self.pieces.all())
    
    # === Règle métier pour la corbeille ===
    def check_can_be_deleted(self):
        """
        On REFUSE la suppression si l'OR est CLOTURÉ et a généré une facture.
        Sinon on autorise (cas erreur de saisie).
        """
        if self.statut == self.STATUT_CLOTURE:
            # Vérifier s'il y a une facture liée via l'intervention
            if self.rdv and self.rdv.factures.exists():
                facture = self.rdv.factures.first()
                raise SuppressionBloqueeError(
                    message=(
                        f"Cet OR est clôturé et lié à la facture {facture.numero}. "
                        f"Pour des raisons de traçabilité, il ne peut pas être supprimé."
                    ),
                    elements_bloquants=[{
                        'type': 'facture',
                        'id': facture.id,
                        'numero': facture.numero,
                    }],
                )


# ============================================================
# LIGNE : PIÈCE UTILISÉE
# ============================================================
class LignePieceUtilisee(models.Model):
    """
    Une pièce sortie du stock pour cet OR.
    1 OR → N lignes pièces.
    Pas de soft-delete : géré avec l'OR parent.
    """
    
    ordre_reparation = models.ForeignKey(
        OrdreReparation,
        on_delete=models.CASCADE,
        related_name='pieces'
    )
    
    # ✅ CORRIGÉ : nom exact 'stock.Piece' (confirmé dans ton backend)
    piece = models.ForeignKey(
        'stock.Piece',
        on_delete=models.PROTECT,
        related_name='utilisations_or'
    )
    
    quantite = models.PositiveIntegerField(default=1)
    
    # Snapshots (l'OR garde la trace même si la pièce est modifiée plus tard)
    designation_snapshot = models.CharField(
        max_length=200,
        blank=True,
        help_text="Auto-rempli au moment de la sortie (ne pas saisir)"
    )
    
    reference_snapshot = models.CharField(
        max_length=100,
        blank=True,
        help_text="Auto-rempli au moment de la sortie (ne pas saisir)"
    )
    
    cree_le = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        """Auto-remplit les snapshots depuis la pièce lors de la création."""
        # Si c'est une création (pas d'ID) ET que les snapshots sont vides
        if not self.pk and self.piece:
            if not self.designation_snapshot:
                self.designation_snapshot = self.piece.nom
            if not self.reference_snapshot:
                self.reference_snapshot = self.piece.reference
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "Pièce utilisée (OR)"
        verbose_name_plural = "Pièces utilisées (OR)"
        ordering = ['cree_le']
    
    def __str__(self):
        return f"{self.quantite}× {self.designation_snapshot}"


# ============================================================
# LIGNE : INTERVENTION / MAIN D'ŒUVRE
# ============================================================
class LigneIntervention(models.Model):
    """
    Une tâche atomique effectuée sur l'OR.
    1 OR → N interventions.
    """
    
    ordre_reparation = models.ForeignKey(
        OrdreReparation,
        on_delete=models.CASCADE,
        related_name='interventions'
    )
    
    date = models.DateField(
        default=date.today,
        help_text="Date à laquelle cette tâche a été effectuée"
    )
    
    # ✅ CORRIGÉ : on utilise ton modèle Referentiel existant
    # avec filtre sur categorie='TYPE_INTERVENTION'
    type_intervention = models.ForeignKey(
        'referentiels.Referentiel',
        on_delete=models.PROTECT,
        related_name='lignes_or_intervention',
        help_text="Type d'intervention (depuis les Référentiels)"
    )
    
    # ✅ CORRIGÉ : on utilise Collaborateur (qui existe déjà !) au lieu d'un champ texte
    mecanicien = models.ForeignKey(
        'planning.Collaborateur',
        on_delete=models.PROTECT,
        related_name='lignes_or_intervention',
        help_text="Mécanicien qui a effectué la tâche"
    )
    
    duree_minutes = models.PositiveIntegerField(
        help_text="Durée en minutes (ex: 90 pour 1h30)"
    )
    
    detail = models.TextField(
        blank=True,
        help_text="Détail / notes sur cette intervention"
    )
    
    cree_le = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "Intervention (OR)"
        verbose_name_plural = "Interventions (OR)"
        ordering = ['date', 'cree_le']
    
    def __str__(self):
        h = self.duree_minutes // 60
        m = self.duree_minutes % 60
        return f"{self.date} — {self.type_intervention.label} ({h}h{m:02d})"
    
    @property
    def duree_formatee(self):
        """Format '1h30' pour affichage."""
        h = self.duree_minutes // 60
        m = self.duree_minutes % 60
        if m == 0:
            return f"{h}h"
        return f"{h}h{m:02d}"