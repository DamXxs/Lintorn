# /backend/archives/models.py

"""
Mixin pour ajouter la fonctionnalité Corbeille + Archives à n'importe quel modèle.

Un "Mixin" en programmation, c'est une classe qu'on greffe à une autre classe
pour lui ajouter des fonctionnalités. Ici, on greffe la corbeille + les archives.

Pour l'utiliser dans un modèle existant :
    class Client(SoftDeleteMixin):  # On hérite du Mixin
        nom = models.CharField(...)
        # ... le reste du modèle

ATTENTION : SoftDeleteMixin est un modèle ABSTRAIT.
"abstract = True" dans Meta = "ne crée PAS de table en BDD pour ce modèle".
C'est juste un modèle parent dont on hérite les champs et méthodes.
"""

from django.db import models
from django.utils import timezone

from .managers import (
    ActiveManager,
    AllObjectsManager,
    DeletedManager,
    ArchivedManager,
)


# ============================================================================
# EXCEPTION PERSONNALISÉE
# ============================================================================

class SuppressionBloqueeError(Exception):
    """
    Exception levée quand une suppression est bloquée par une règle métier.

    On l'utilise pour transmettre les détails du blocage au frontend :
    - le message à afficher
    - la liste des éléments bloquants (RDV, factures, etc.)
    """

    def __init__(self, message, elements_bloquants=None):
        super().__init__(message)
        self.message = message
        # Liste de dicts décrivant ce qui bloque (sera renvoyé au frontend)
        self.elements_bloquants = elements_bloquants or []


# ============================================================================
# MIXIN PRINCIPAL
# ============================================================================

class SoftDeleteMixin(models.Model):
    """
    Modèle abstrait qui ajoute à tous les modèles enfants :

    TRAÇABILITÉ :
      - created_at   : date de création (remplie automatiquement)
      - updated_at   : date de dernière modification (mise à jour automatiquement)

    CORBEILLE :
      - is_deleted   : True si l'élément est dans la corbeille
      - deleted_at   : date de mise en corbeille

    ARCHIVES :
      - is_archived  : True si l'élément est archivé
      - archived_at  : date d'archivage

    MANAGERS :
      - objects          : éléments actifs uniquement (défaut)
      - all_objects      : tous les éléments sans filtre
      - deleted_objects  : éléments en corbeille uniquement
      - archived_objects : éléments archivés uniquement
    """

    # ── TRAÇABILITÉ ───────────────────────────────────────────────────────
    # auto_now_add=True → Django remplit ce champ automatiquement
    # à la création de l'objet. On ne peut plus le modifier ensuite.
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Date de création",
        help_text="Rempli automatiquement à la création"
    )

    # auto_now=True → Django met à jour ce champ automatiquement
    # à chaque appel de .save(). Parfait pour savoir quand un élément a changé.
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
        help_text="Date à laquelle l'élément a été mis en corbeille"
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
        help_text="Date à laquelle l'élément a été archivé"
    )

    # ── MANAGERS ──────────────────────────────────────────────────────────
    # IMPORTANT : le PREMIER manager déclaré devient le manager par défaut.
    # On met ActiveManager en premier pour que Client.objects.all()
    # ne retourne QUE les éléments actifs automatiquement.
    objects          = ActiveManager()
    all_objects      = AllObjectsManager()
    deleted_objects  = DeletedManager()
    archived_objects = ArchivedManager()

    class Meta:
        # abstract = True → Django ne crée PAS de table BDD pour ce modèle.
        # C'est uniquement un modèle parent qu'on greffe aux autres.
        abstract = True

    # ========================================================================
    # MÉTHODE À REDÉFINIR DANS CHAQUE MODÈLE ENFANT
    # ========================================================================

    def check_can_be_deleted(self):
        """
        Vérifie si l'élément peut être mis en corbeille.

        À REDÉFINIR dans chaque modèle qui hérite du Mixin pour y placer
        ses propres règles métier (ex: Client ne peut pas être supprimé
        s'il a des RDV à venir).

        Doit lever une SuppressionBloqueeError si bloqué.
        Sinon, ne fait rien (= autorise la suppression).
        """
        # Par défaut : aucun blocage. Chaque modèle redéfinira si besoin.
        pass

    # ========================================================================
    # MÉTHODES CORBEILLE
    # ========================================================================

    def soft_delete(self, force=False):
        """
        Met l'élément dans la corbeille (suppression douce).

        Args:
            force (bool): Si True, ignore les règles de blocage.
                         À utiliser avec précaution !

        Raises:
            SuppressionBloqueeError: Si une règle métier bloque la suppression.
        """
        # On vérifie les règles métier (sauf si force=True)
        if not force:
            self.check_can_be_deleted()

        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save()

    def restore(self):
        """
        Restaure un élément depuis la corbeille (le rend à nouveau actif).
        """
        self.is_deleted = False
        self.deleted_at = None
        self.save()

    def hard_delete(self):
        """
        Supprime DÉFINITIVEMENT l'élément de la base de données.
        Action irréversible !

        On utilise super().delete() pour appeler la vraie méthode delete()
        de Django (celle qui supprime vraiment de la BDD).
        """
        super().delete()

    # ========================================================================
    # MÉTHODES ARCHIVES
    # ========================================================================

    def archive(self):
        """
        Archive l'élément (le cache des vues principales).

        Différence avec la corbeille :
          - Corbeille = suppression temporaire → purgée après 8 jours
          - Archives  = conservation longue durée (légale : factures/OR 13 mois)
        """
        self.is_archived = True
        self.archived_at = timezone.now()
        self.save()

    def unarchive(self):
        """
        Sort l'élément des archives (le rend à nouveau actif).
        """
        self.is_archived = False
        self.archived_at = None
        self.save()

    # ========================================================================
    # SURCHARGE DE delete()
    # ========================================================================

    def delete(self, *args, **kwargs):
        """
        On surcharge la méthode delete() de Django pour qu'elle fasse
        un soft_delete au lieu d'un hard_delete par défaut.

        Comme ça, même si quelqu'un écrit client.delete() par erreur,
        ça mettra le client en corbeille plutôt que de le supprimer.

        Pour vraiment supprimer : utiliser hard_delete().
        """
        self.soft_delete()