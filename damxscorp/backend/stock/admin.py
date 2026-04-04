# /backend/stock/admin.py
from django.contrib import admin
from django.utils.html import format_html
from .models import Piece


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
        # stock_status est une @property → on filtre manuellement
        val = self.value()
        if not val:
            return qs
        ids = [p.pk for p in qs if p.stock_status == val]
        return qs.filter(pk__in=ids)


# =============================================================================
# ADMIN PIÈCE
# =============================================================================
@admin.register(Piece)
class PieceAdmin(admin.ModelAdmin):
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
    search_fields = ('reference', 'nom', 'fournisseur', 'description')

    # ── Filtres latéraux ──────────────────────────────────────────────────────
    list_filter = ('categorie', StatutStockFilter, 'fournisseur_ref', 'date_creation')

    # ── Tri par défaut ────────────────────────────────────────────────────────
    ordering = ('categorie', 'nom')

    # ── Édition rapide dans la liste (double-clic sur la cellule) ─────────────
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
            'fields': ('fournisseur', 'fournisseur_ref'),
            'description': (
                'Utilisez fournisseur_ref pour lier la fiche fournisseur (email automatique). '
                'Le champ "fournisseur" texte libre est conservé pour compatibilité.'
            ),
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
        'date_creation',
        'date_modification',
    )

    # ── Colonne statut colorée ────────────────────────────────────────────────
    @admin.display(description='Statut', ordering='stock_actuel')
    def statut_colore(self, obj):
        styles = {
            'OK':      ('#27ae60', '✅ OK'),
            'ALERTE':  ('#f39c12', '⚠️ Alerte'),
            'RUPTURE': ('#e74c3c', '🔴 Rupture'),
        }
        couleur, label = styles.get(obj.stock_status, ('#aaa', obj.stock_status))
        return format_html(
            '<span style="color:{}; font-weight:bold;">{}</span>',
            couleur, label
        )
