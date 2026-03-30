# /backend/factures/models.py
from datetime import datetime
from django.db import models
from clients.models import Client
from planning.models import Intervention
from stock.models import Piece


# =============================================================================
# UTILITAIRES : Génération numéros uniques
# =============================================================================

def generer_numero_devis():
    """Génère un numéro unique au format DEV-YY-NNNNN (ex: DEV-26-00001)"""
    # get_or_create avec pk=1 garantit un singleton
    params, _ = ParametresFacturation.objects.get_or_create(pk=1)
    annee = datetime.now().year % 100     # 2026 → 26
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
# =============================================================================

class ParametresFacturation(models.Model):
    """
    Paramètres globaux du système de facturation.
    Il n'existe qu'UN seul enregistrement (pk=1).
    """
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
# MODÈLE FORFAIT INTERVENTION (catalogue main d'œuvre personnalisable)
# =============================================================================

class ForfaitIntervention(models.Model):
    """
    Catalogue des forfaits de main d'œuvre configurables dans les paramètres.
    Exemple : "Vidange VP 2L" = 50€, "Révision complète" = 150€
    Quand on ajoute une ligne de ce type dans un devis, le prix est pré-rempli.
    """
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
# MODÈLE DEVIS
# =============================================================================

class Devis(models.Model):
    """
    Devis proposé au client avant une intervention.
    Cycle de vie : CREE → VALIDE → (après intervention) → FACTURE
                                 → REFUSE ou EXPIRE (fin de vie)
    """

    STATUT_CHOICES = [
        ('CREE', 'Créé'),
        ('VALIDE', 'Validé par client'),
        ('REFUSE', 'Refusé par client'),
        ('EXPIRE', 'Expiré'),
        ('FACTURE', 'Devenu facture'),
    ]

    # --- Identifiant ---
    numero = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        help_text="Généré automatiquement : DEV-YY-NNNNN"
    )

    # --- Relations ---
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

    # --- Dates ---
    date_creation = models.DateField(auto_now_add=True)
    date_validite = models.DateField(
        help_text="Date d'expiration du devis (au-delà → EXPIRE)"
    )

    # --- Montants (calculés automatiquement, ne pas saisir manuellement) ---
    montant_ht = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tva = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_ttc = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # --- Statut ---
    statut = models.CharField(
        max_length=20,
        choices=STATUT_CHOICES,
        default='CREE'
    )

    # --- Notes ---
    notes = models.TextField(blank=True, null=True)

    # --- Timestamps ---
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.numero} — {self.client}"

    def save(self, *args, **kwargs):
        # Génère le numéro automatiquement à la première sauvegarde
        if not self.numero:
            self.numero = generer_numero_devis()
        super().save(*args, **kwargs)

    def calculer_montants(self):
        """
        Recalcule les totaux HT/TVA/TTC depuis les lignes.
        Appelé automatiquement par LigneDevis.save() et LigneDevis.delete().
        """
        params, _ = ParametresFacturation.objects.get_or_create(pk=1)
        self.montant_ht = sum(
            ligne.sous_total()
            for ligne in self.lignes_devis.all()
        )
        self.tva = self.montant_ht * (params.tva_pourcentage / 100)
        self.montant_ttc = self.montant_ht + self.tva
        self.save()

    def liberer_stock_suspendu(self):
        """
        Libère les pièces suspendues quand le devis est REFUSE ou EXPIRE.
        Les pièces redeviennent disponibles pour d'autres devis.
        """
        for ligne in self.lignes_devis.all():
            if ligne.piece:
                piece = ligne.piece
                piece.stock_suspendu = max(0, piece.stock_suspendu - ligne.quantite)
                piece.save()

    def consommer_stock(self):
        """
        Consomme définitivement les pièces du stock lors de la création de la facture.
        stock_actuel diminue ET stock_suspendu est libéré.
        """
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


# =============================================================================
# MODÈLE LIGNE DEVIS
# =============================================================================

class LigneDevis(models.Model):
    """
    Une ligne dans un devis : soit une pièce du stock, soit un service libre (main-d'œuvre).
    La pièce est automatiquement "suspendue" en stock à l'ajout de la ligne.
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

        # Si la ligne existe déjà, on mémorise l'ancienne pièce et quantité
        if not is_new:
            try:
                ancienne = LigneDevis.objects.get(pk=self.pk)
                old_quantite = ancienne.quantite
                old_piece_id = ancienne.piece_id
            except LigneDevis.DoesNotExist:
                is_new = True

        super().save(*args, **kwargs)

        # --- Gestion du stock suspendu ---
        if is_new:
            # Nouvelle ligne avec une pièce → suspendre la quantité
            if self.piece:
                self.piece.stock_suspendu += self.quantite
                self.piece.save()
        else:
            # Mise à jour : recalculer les écarts
            if old_piece_id != self.piece_id:
                # La pièce a changé → libérer l'ancienne, suspendre la nouvelle
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
                # Même pièce, quantité modifiée → ajuster la différence
                diff = self.quantite - old_quantite
                self.piece.stock_suspendu = max(0, self.piece.stock_suspendu + diff)
                self.piece.save()

        # Recalcule les totaux du devis parent
        self.devis.calculer_montants()

    def delete(self, *args, **kwargs):
        devis_parent = self.devis
        # Libérer le stock suspendu avant suppression
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
# MODÈLE FACTURE
# =============================================================================

class Facture(models.Model):
    """
    Facture émise après réalisation de l'intervention.
    Créée depuis un devis validé ou directement.
    """

    STATUT_CHOICES = [
        ('EMISE', 'Émise'),
        ('PAYEE', 'Payée'),
        ('IMPAYEE', 'Impayée'),
        ('PARTIELLEMENT_PAYEE', 'Partiellement payée'),
    ]

    # --- Identifiant ---
    numero = models.CharField(
        max_length=20,
        unique=True,
        editable=False,
        help_text="Généré automatiquement : FAC-YY-NNNNN"
    )

    # --- Relations ---
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

    # --- Dates ---
    date_emission = models.DateField(auto_now_add=True)
    date_echeance = models.DateField(
        help_text="Date à laquelle le paiement est attendu"
    )

    # --- Montants ---
    montant_ht = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tva = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_ttc = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    montant_paye = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Montant déjà encaissé"
    )

    # --- Statut ---
    statut = models.CharField(
        max_length=25,
        choices=STATUT_CHOICES,
        default='EMISE'
    )

    # --- Notes ---
    notes = models.TextField(blank=True, null=True)

    # --- Timestamps ---
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


# =============================================================================
# MODÈLE LIGNE FACTURE
# =============================================================================

class LigneFacture(models.Model):
    """
    Une ligne dans une facture : pièce ou service.
    Même structure que LigneDevis, copiée depuis le devis lors de la conversion.
    Ici, les pièces ne suspendent PAS le stock (déjà géré côté devis).
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
