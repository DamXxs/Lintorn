# /backend/stock/admin.py
from django.contrib import admin
from django.db.models import F, ExpressionWrapper, IntegerField
from django.utils.html import format_html
from .models import Piece
from archives.admin import SoftDeleteAdminMixin


# =============================================================================
# FILTRE PERSONNALISÉ PAR STATUT DE STOCK
# Permet de filtrer dans la sidebar admin : OK / ALERTE / RUPTURE
# =============================================================================
class StatutStockFilter(admin.SimpleListFilter):
    title = 'Statut stock'
    parameter_name = 'statut_stock'

    def lookups(self, request, model_admin):
        return [
            ('OK',      '✅ OK'),
            ('ALERTE',  '⚠️ Alerte'),
            ('RUPTURE', '🔴 Rupture'),
        ]

    def queryset(self, request, qs):
        val = self.value()

        if val == 'RUPTURE':
            # Stock disponible <= 0 (tout le stock est suspendu ou épuisé)
            return qs.filter(stock_actuel__lte=F('stock_suspendu'))

        if val in ('ALERTE', 'OK'):
            # Django ne peut pas faire "stock_actuel - stock_suspendu" directement
            # dans un lookup → on utilise annotate() pour créer un champ calculé SQL
            qs = qs.annotate(
                stock_dispo=ExpressionWrapper(
                    F('stock_actuel') - F('stock_suspendu'),
                    output_field=IntegerField()
                )
            )
            if val == 'ALERTE':
                # Stock dispo > 0 mais sous le seuil minimum
                return qs.filter(stock_dispo__gt=0, stock_dispo__lt=F('stock_minimum'))
            # OK : stock dispo >= seuil minimum
            return qs.filter(stock_dispo__gte=F('stock_minimum'))

        return qs


# =============================================================================
# ADMIN PIÈCE
# =============================================================================
@admin.register(Piece)
class PieceAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    """
    Interface admin complète pour gérer les pièces de stock.
    Accessible via /admin/stock/piece/

    Fonctionnalités :
      - Filtre par statut stock (OK / Alerte / Rupture)
      - Édition rapide de stock_actuel et stock_minimum dans la liste
      - Colonne statut colorée
      - Formulaire organisé en sections
    """

    # ── Colonnes dans la liste ────────────────────────────────────────────────
    list_display = (
        'reference',
        'nom',
        'categorie',
        'stock_actuel',
        'stock_minimum',
        'statut_colore',
        'fournisseur_ref',
        'prix_achat',
        'prix_vente',
        'delai_livraison',
    )

    # ── Recherche ─────────────────────────────────────────────────────────────
    search_fields = ('reference', 'nom', 'description', 'fournisseur_ref__nom')

    # ── Filtres latéraux ──────────────────────────────────────────────────────
    list_filter = ('categorie', StatutStockFilter, 'fournisseur_ref', 'created_at')

    # ── Tri par défaut ────────────────────────────────────────────────────────
    ordering = ('categorie', 'nom')

    # ── Édition rapide dans la liste ──────────────────────────────────────────
    list_editable = ('stock_actuel', 'stock_minimum')

    # ── Organisation du formulaire en sections ────────────────────────────────
    fieldsets = (
        ('Identification', {
            'fields': ('reference', 'nom', 'description', 'categorie'),
        }),
        ('Prix', {
            'fields': ('prix_achat', 'prix_vente'),
        }),
        ('Stock', {
            'fields': ('stock_actuel', 'stock_minimum', 'stock_suspendu', 'delai_livraison'),
            'description': '⚠️ stock_suspendu est géré automatiquement par les devis, ne pas le modifier manuellement.',
        }),
        ('Fournisseur', {
            'fields': ('fournisseur_ref',),
            'description': 'Liez une fiche fournisseur pour la génération automatique d\'email de commande.',
        }),
        ('Infos calculées (lecture seule)', {
            'fields': ('stock_status', 'stock_disponible', 'marge', 'marge_pourcentage'),
            'classes': ('collapse',),
        }),
    )

    # ── Champs toujours en lecture seule ──────────────────────────────────────
    readonly_fields = (
        'stock_status',
        'stock_disponible',
        'marge',
        'marge_pourcentage',
        'created_at',
        'updated_at',
    )

    # ── Colonne statut colorée ────────────────────────────────────────────────
    @admin.display(description='Statut', ordering='stock_actuel')
    def statut_colore(self, obj):
        couleurs = {
            'OK':      ('#27ae60', '✅ OK'),
            'ALERTE':  ('#f39c12', '⚠️ Alerte'),
            'RUPTURE': ('#e74c3c', '🔴 Rupture'),
        }
        status = obj.stock_status
        couleur, label = couleurs.get(status, ('#95a5a6', status))
        return format_html(
            '<span style="'
            'background:{};color:#fff;padding:3px 10px;'
            'border-radius:12px;font-size:12px;font-weight:600;'
            '">{}</span>',
            couleur, label
        )
