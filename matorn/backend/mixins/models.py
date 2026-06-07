"""
Mixin principal du projet Matorn.

SoftDeleteMixin est un modèle abstrait Django qui ajoute à tous les modèles
qui en héritent :
  - Traçabilité  : created_at, updated_at
  - Corbeille    : is_deleted, deleted_at + méthodes soft_delete / restore
  - Archives     : is_archived, archived_at + méthodes archive / unarchive
  - Managers     : objects (actifs), all_objects, deleted_objects, archived_objects

Usage :
    from mixins.models import SoftDeleteMixin, SuppressionBloqueeError

    class MonModele(SoftDeleteMixin):
        nom = models.CharField(...)
"""

from django.db import models
from django.utils import timezone

from .managers import ActiveManager, AllObjectsManager, DeletedManager, ArchivedManager


# ============================================================================
# EXCEPTION PERSONNALISÉE
# ============================================================================

class SuppressionBloqueeError(Exception):
    """
    Levée quand une suppression est bloquée par une règle métier.
    Transmet au frontend : le message d'erreur + la liste des éléments bloquants.
    """

    def __init__(self, message, elements_bloquants=None):
        super().__init__(message)
        self.message = message
        self.elements_bloquants = elements_bloquants or []


# ============================================================================
# MIXIN PRINCIPAL
# ============================================================================

class SoftDeleteMixin(models.Model):
    """
    Modèle abstrait — ne crée PAS de table en BDD (abstract = True).
    À hériter dans chaque modèle métier pour obtenir corbeille + archives.
    """

    # ── TRAÇABILITÉ ───────────────────────────────────────────────────────
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création",
        help_text="Rempli automatiquement à la création"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="Dernière modification",
        help_text="Mis à jour automatiquement à chaque modification"
    )

    # ── CORBEILLE ─────────────────────────────────────────────────────────
    is_deleted = models.BooleanField(
        default=False,
        verbose_name="En corbeille",
        help_text="L'élément est dans la corbeille (suppression douce)"
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date de mise en corbeille",
    )

    # ── ARCHIVES ──────────────────────────────────────────────────────────
    is_archived = models.BooleanField(
        default=False,
        verbose_name="Archivé",
        help_text="L'élément est archivé (caché des vues principales)"
    )
    archived_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Date d'archivage",
    )

    # ── MANAGERS ──────────────────────────────────────────────────────────
    # Le PREMIER manager déclaré est le manager par défaut.
    # ActiveManager en premier → Model.objects.all() ne retourne que les actifs.
    objects          = ActiveManager()
    all_objects      = AllObjectsManager()
    deleted_objects  = DeletedManager()
    archived_objects = ArchivedManager()

    class Meta:
        abstract = True

    # ── À REDÉFINIR DANS CHAQUE MODÈLE ENFANT ────────────────────────────

    def check_can_be_deleted(self):
        """
        Vérifie si l'élément peut être mis en corbeille.
        Redéfinir dans chaque modèle pour y placer les règles métier.
        Doit lever SuppressionBloqueeError si bloqué, sinon ne fait rien.
        """
        pass

    # ── CORBEILLE ─────────────────────────────────────────────────────────

    def soft_delete(self, force=False):
        """Met l'élément en corbeille. Lève SuppressionBloqueeError si bloqué."""
        if not force:
            self.check_can_be_deleted()
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        """Restaure un élément depuis la corbeille."""
        self.is_deleted = False
        self.deleted_at = None
        self.save()

    def hard_delete(self):
        """Supprime DÉFINITIVEMENT l'élément. Action irréversible."""
        super().delete()

    # ── ARCHIVES ──────────────────────────────────────────────────────────

    def archive(self):
        """Archive l'élément (conservation longue durée)."""
        self.is_archived = True
        self.archived_at = timezone.now()
        self.save()

    def unarchive(self):
        """Sort l'élément des archives."""
        self.is_archived = False
        self.archived_at = None
        self.save()

    # ── SURCHARGE delete() ────────────────────────────────────────────────

    def delete(self, *args, **kwargs):
        """Redirige delete() vers soft_delete() pour éviter les suppressions accidentelles."""
        self.soft_delete()
