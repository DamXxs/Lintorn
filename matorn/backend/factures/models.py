# /backend/factures/models.py
from datetime import datetime
from django.db import models

from clients.models import Client
from planning.models import Intervention
from stock.models import Piece

# IMPORT du Mixin et de l'exception
from archives.models import SoftDeleteMixin, SuppressionBloqueeError


# =============================================================================
# UTILITAIRES : Génération numéros uniques
# =============================================================================

def generer_numero_devis():
    """Génère un numéro unique au format DEV-YY-NNNNN (ex: DEV-26-00001)"""
    params, _ = ParametresFacturation.objects.get_or_create(pk=1)
    annee = datetime.now().year % 100
    numero = params.numero_devis_actuel
    params.numero_devis_actuel += 1
    params.save()
    return f"DEV-{annee:02d}-{numero:05d}"


def generer_numero_facture():
    """Génère un numéro unique au format FAC-YY-NNNNN (ex: FAC-26-00001)"""
    params, _ = ParametresFacturation.objects.get_or_create(pk=1)
    annee = datetime.now().year % 100
    numero = params.numero_facture_actuel
    params.numero_facture_actuel += 1
    params.save()
    return f"FAC-{annee:02d}-{numero:05d}"


# =============================================================================
# MODÈLE PARAMÈTRES FACTURATION (Singleton)
# INCHANGÉ — pas de soft-delete (singleton de config)
# =============================================================================

class ParametresFacturation(models.Model):
    # === Infos garage (en-tête des documents PDF) ===
    nom_garage = models.CharField(max_length=200, blank=True, default='')
    adresse_garage = models.TextField(blank=True, default='')
    telephone_garage = models.CharField(max_length=20, blank=True, default='')
    email_garage = models.EmailField(blank=True, default='')
    siret = models.CharField(max_length=20, blank=True, default='')
    numero_tva = models.CharField(
        max_length=20, blank=True, default='',
        help_text="Numéro TVA intracommunautaire (ex: FR12345678900)"
    )

    # === Facturation ===
    tva_pourcentage = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=20.00,
        help_text="Taux de TVA en % (ex: 20.00 pour 20%)"
    )
    numero_devis_actuel = models.IntegerField(
        default=1,
        help_text="Compteur auto-incrémenté pour les numéros de devis"
    )
    numero_facture_actuel = models.IntegerField(
        default=1,
        help_text="Compteur auto-incrémenté pour les numéros de factures"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Paramètres Facturation — TVA: {self.tva_pourcentage}%"

    class Meta:
        verbose_name = "Paramètres Facturation"
        verbose_name_plural = "Paramètres Facturation"


# =============================================================================
# MODÈLE FORFAIT INTERVENTION
# INCHANGÉ — pas de soft-delete (catalogue de config)
# =============================================================================

class ForfaitIntervention(models.Model):
    nom = models.CharField(
        max_length=200,
        help_text="Nom du forfait (ex: Vidange VP 2L)"
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Description détaillée (optionnel)"
    )
    prix_forfait = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Prix HT du forfait en euros"
    )
    actif = models.BooleanField(
        default=True,
        help_text="Si False, ce forfait n'apparaît plus dans les devis"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nom} — {self.prix_forfait} €"

    class Meta:
        ordering = ['nom']
        verbose_name = "Forfait Intervention"
        verbose_name_plural = "Forfaits Intervention"


# =============================================================================
# MODÈLE DEVIS  (MODIFIÉ : hérite de SoftDeleteMixin)
# =============================================================================

class Devis(SoftDeleteMixin):  # ← MODIF
    """
    Devis proposé au client avant une intervention.
    Cycle de vie : CREE → VALIDE → (après intervention) → FACTURE
                                 → REFUSE ou EXPIRE (fin de vie)
    
    NOUVEAU : Hérite de SoftDeleteMixin → corbeille + archives.
    """

    STATUT_CHOICES = [
        ('CREE', 'Créé'),
        ('VALIDE', 'Validé par client'),
        ('REFUSE', 'Refusé par client'),
        ('EXPIRE', 'Expiré'),
        ('FACTURE', 'Devenu facture'),
    ]

    numero = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        help_text="Généré automatiquement : DEV-YY-NNNNN"
    )

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='devis',
        help_text="Client concerné par ce devis"
    )
    intervention = models.ForeignKey(
        Intervention,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='devis',
        help_text="Intervention liée (optionnel)"
    )

    date_creation = models.DateField(auto_now_add=True)
    date_validite = models.DateField(
        help_text="Date d'expiration du devis (au-delà → EXPIRE)"
    )

    montant_ht = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tva = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_ttc = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='CREE'
    )

    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.numero} — {self.client}"

    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = generer_numero_devis()
        super().save(*args, **kwargs)

    def calculer_montants(self):
        """Recalcule les totaux HT/TVA/TTC depuis les lignes."""
        params, _ = ParametresFacturation.objects.get_or_create(pk=1)
        self.montant_ht = sum(
            ligne.sous_total()
            for ligne in self.lignes_devis.all()
        )
        self.tva = self.montant_ht * (params.tva_pourcentage / 100)
        self.montant_ttc = self.montant_ht + self.tva
        self.save()

    def liberer_stock_suspendu(self):
        """Libère les pièces suspendues quand le devis est REFUSE ou EXPIRE."""
        for ligne in self.lignes_devis.all():
            if ligne.piece:
                piece = ligne.piece
                piece.stock_suspendu = max(0, piece.stock_suspendu - ligne.quantite)
                piece.save()

    def consommer_stock(self):
        """Consomme définitivement les pièces du stock lors de la création de la facture."""
        for ligne in self.lignes_devis.all():
            if ligne.piece:
                piece = ligne.piece
                piece.stock_actuel = max(0, piece.stock_actuel - ligne.quantite)
                piece.stock_suspendu = max(0, piece.stock_suspendu - ligne.quantite)
                piece.save()

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Devis"
        verbose_name_plural = "Devis"
    
    # =========================================================================
    # NOUVEAU : Règle métier pour la corbeille
    # =========================================================================
    def check_can_be_deleted(self):
        """
        On REFUSE la suppression si le devis est déjà transformé en facture.
        Sinon (CREE, VALIDE, REFUSE, EXPIRE), on autorise.
        
        IMPORTANT : si un devis est supprimé alors qu'il avait des pièces suspendues,
        il faut libérer le stock. On gère ça dans la méthode soft_delete().
        """
        if self.statut == 'FACTURE':
            # On va chercher la facture liée pour informer
            facture_liee = self.factures.first()  # objects par défaut = active
            
            elements_bloquants = []
            if facture_liee:
                elements_bloquants.append({
                    'type': 'facture',
                    'id': facture_liee.id,
                    'numero': facture_liee.numero,
                    'montant_ttc': float(facture_liee.montant_ttc),
                    'statut': facture_liee.get_statut_display(),
                })
            
            raise SuppressionBloqueeError(
                message=(
                    f"Ce devis a été transformé en facture ({facture_liee.numero if facture_liee else '?'}). "
                    f"Vous ne pouvez pas le supprimer."
                ),
                elements_bloquants=elements_bloquants,
            )
    
    # =========================================================================
    # NOUVEAU : surcharge de soft_delete pour libérer le stock
    # =========================================================================
    def soft_delete(self, force=False):
        """
        Avant de mettre le devis en corbeille, on libère le stock suspendu.
        Sinon, des pièces resteraient bloquées inutilement.
        """
        # On libère le stock AVANT le soft-delete
        if self.statut in ['CREE', 'VALIDE']:
            self.liberer_stock_suspendu()
        
        # Puis on appelle la méthode du parent (le Mixin)
        super().soft_delete(force=force)


# =============================================================================
# MODÈLE LIGNE DEVIS  (INCHANGÉ — pas de soft-delete)
# =============================================================================

class LigneDevis(models.Model):
    """
    Une ligne dans un devis. Liée en CASCADE au devis parent.
    Si le devis est soft-deleted, les lignes restent en BDD mais ne sont plus
    accessibles via devis.lignes_devis (car le Manager du Devis filtre).
    
    Note : on ne met PAS de soft-delete sur les lignes individuelles,
    car elles sont gérées comme une unité avec leur Devis parent.
    """

    devis = models.ForeignKey(
        Devis,
        on_delete=models.CASCADE,
        related_name='lignes_devis'
    )
    piece = models.ForeignKey(
        Piece,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lignes_devis',
        help_text="Laisser vide pour une ligne de service / main-d'œuvre libre"
    )
    description = models.CharField(
        max_length=255,
        help_text="Nom de la pièce ou description du service"
    )
    quantite = models.IntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def sous_total(self):
        return self.quantite * self.prix_unitaire

    def save(self, *args, **kwargs):
        is_new = self.pk is None
        old_quantite = 0
        old_piece_id = None

        if not is_new:
            try:
                ancienne = LigneDevis.objects.get(pk=self.pk)
                old_quantite = ancienne.quantite
                old_piece_id = ancienne.piece_id
            except LigneDevis.DoesNotExist:
                is_new = True

        super().save(*args, **kwargs)

        if is_new:
            if self.piece:
                self.piece.stock_suspendu += self.quantite
                self.piece.save()
        else:
            if old_piece_id != self.piece_id:
                if old_piece_id:
                    try:
                        ancienne_piece = Piece.objects.get(pk=old_piece_id)
                        ancienne_piece.stock_suspendu = max(0, ancienne_piece.stock_suspendu - old_quantite)
                        ancienne_piece.save()
                    except Piece.DoesNotExist:
                        pass
                if self.piece:
                    self.piece.stock_suspendu += self.quantite
                    self.piece.save()
            elif self.piece and old_quantite != self.quantite:
                diff = self.quantite - old_quantite
                self.piece.stock_suspendu = max(0, self.piece.stock_suspendu + diff)
                self.piece.save()

        self.devis.calculer_montants()

    def delete(self, *args, **kwargs):
        devis_parent = self.devis
        if self.piece:
            self.piece.stock_suspendu = max(0, self.piece.stock_suspendu - self.quantite)
            self.piece.save()
        super().delete(*args, **kwargs)
        devis_parent.calculer_montants()

    def __str__(self):
        return f"{self.description} × {self.quantite}"

    class Meta:
        verbose_name = "Ligne Devis"
        verbose_name_plural = "Lignes Devis"


# =============================================================================
# MODÈLE FACTURE  (MODIFIÉ : hérite de SoftDeleteMixin)
# =============================================================================

class Facture(SoftDeleteMixin):  # ← MODIF
    """
    Facture émise après réalisation de l'intervention.
    
    NOUVEAU : Hérite de SoftDeleteMixin → corbeille + archives.
    
    LOGIQUE LÉGALE FRANÇAISE :
    - Une facture émise ne peut quasiment plus être supprimée (10 ans de conservation)
    - Sauf si EMISE et aucun paiement (cas erreur de saisie immédiate)
    - Sinon → archivage au bout d'1 an + 1 mois (géré par commande auto)
    """

    STATUT_CHOICES = [
        ('EMISE', 'Émise'),
        ('PAYEE', 'Payée'),
        ('IMPAYEE', 'Impayée'),
        ('PARTIELLEMENT_PAYEE', 'Partiellement payée'),
    ]

    numero = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        help_text="Généré automatiquement : FAC-YY-NNNNN"
    )

    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='factures'
    )
    devis = models.ForeignKey(
        Devis,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='factures',
        help_text="Devis d'origine (optionnel si facture directe)"
    )
    intervention = models.ForeignKey(
        Intervention,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='factures'
    )

    date_emission = models.DateField(auto_now_add=True)
    date_echeance = models.DateField(
        help_text="Date à laquelle le paiement est attendu"
    )

    montant_ht = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tva = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_ttc = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_paye = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Montant déjà encaissé"
    )

    statut = models.CharField(
        max_length=25,
        choices=STATUT_CHOICES,
        default='EMISE'
    )

    notes = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.numero} — {self.client}"

    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = generer_numero_facture()
        super().save(*args, **kwargs)

    def calculer_montants(self):
        """Recalcule les totaux depuis les lignes de la facture."""
        params, _ = ParametresFacturation.objects.get_or_create(pk=1)
        self.montant_ht = sum(
            ligne.sous_total()
            for ligne in self.lignes_facture.all()
        )
        self.tva = self.montant_ht * (params.tva_pourcentage / 100)
        self.montant_ttc = self.montant_ht + self.tva
        self.save()

    def mettre_a_jour_statut_paiement(self):
        """Met à jour le statut selon le montant payé."""
        if self.montant_paye <= 0:
            self.statut = 'EMISE'
        elif self.montant_paye < self.montant_ttc:
            self.statut = 'PARTIELLEMENT_PAYEE'
        else:
            self.statut = 'PAYEE'
        self.save()

    @property
    def solde_restant(self):
        return self.montant_ttc - self.montant_paye

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Facture"
        verbose_name_plural = "Factures"
    
    # =========================================================================
    # NOUVEAU : Règle métier pour la corbeille
    # =========================================================================
    def check_can_be_deleted(self):
        """
        Suppression d'une facture = action TRÈS sensible (légalement).
        
        On autorise UNIQUEMENT si :
        - Statut EMISE (vient d'être créée)
        - ET aucun paiement encore reçu (montant_paye == 0)
        
        Sinon → bloqué. La facture restera et sera archivée plus tard
        par la commande automatique (1 an + 1 mois).
        """
        # Cas 1 : facture payée ou partiellement payée → JAMAIS supprimable
        if self.statut in ['PAYEE', 'PARTIELLEMENT_PAYEE']:
            raise SuppressionBloqueeError(
                message=(
                    f"Cette facture a reçu un paiement de {self.montant_paye}€. "
                    f"Pour des raisons légales (conservation 10 ans), elle ne peut pas être supprimée. "
                    f"Elle sera archivée automatiquement au bout d'1 an et 1 mois."
                ),
                elements_bloquants=[],
            )
        
        # Cas 2 : facture impayée → on bloque aussi (créance en cours)
        if self.statut == 'IMPAYEE':
            raise SuppressionBloqueeError(
                message=(
                    f"Cette facture est marquée comme impayée. "
                    f"Annulez d'abord le statut ou enregistrez le paiement avant de la supprimer."
                ),
                elements_bloquants=[],
            )
        
        # Cas 3 : EMISE avec paiement déjà partiel (sécurité supplémentaire)
        if self.montant_paye > 0:
            raise SuppressionBloqueeError(
                message=(
                    f"Cette facture a déjà reçu un paiement partiel de {self.montant_paye}€. "
                    f"Elle ne peut pas être supprimée."
                ),
                elements_bloquants=[],
            )
        
        # Sinon : EMISE + montant_paye=0 → suppression autorisée
        # (cas erreur de saisie immédiate)
    
    # =========================================================================
    # NOUVEAU : Méthode pour l'archivage automatique
    # =========================================================================
    def doit_etre_archivee(self):
        """
        Détermine si cette facture doit être archivée.
        Critère : facture PAYEE depuis plus d'1 an et 1 mois (= 13 mois).
        
        Sera utilisée par la commande automatique d'archivage.
        """
        from django.utils import timezone
        from dateutil.relativedelta import relativedelta
        
        if self.statut != 'PAYEE':
            return False
        
        if self.is_archived:
            return False
        
        # Date limite : aujourd'hui - 13 mois
        date_limite = timezone.now().date() - relativedelta(months=13)
        
        return self.date_emission <= date_limite


# =============================================================================
# MODÈLE LIGNE FACTURE  (INCHANGÉ — pas de soft-delete)
# =============================================================================

class LigneFacture(models.Model):
    """
    Une ligne dans une facture : pièce ou service.
    Liée en CASCADE à la facture parent.
    """

    facture = models.ForeignKey(
        Facture,
        on_delete=models.CASCADE,
        related_name='lignes_facture'
    )
    piece = models.ForeignKey(
        Piece,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='lignes_facture'
    )
    description = models.CharField(max_length=255)
    quantite = models.IntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def sous_total(self):
        return self.quantite * self.prix_unitaire

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        self.facture.calculer_montants()

    def delete(self, *args, **kwargs):
        facture_parent = self.facture
        super().delete(*args, **kwargs)
        facture_parent.calculer_montants()

    def __str__(self):
        return f"{self.description} × {self.quantite}"

    class Meta:
        verbose_name = "Ligne Facture"
        verbose_name_plural = "Lignes Facture"