# /backend/factures/admin.py
from django.contrib import admin
from .models import ParametresFacturation, Devis, LigneDevis, Facture, LigneFacture
from archives.admin import SoftDeleteAdminMixin


# --- Inline pour les lignes ---

class LigneDevisInline(admin.TabularInline):
    model = LigneDevis
    extra = 0
    readonly_fields = ('sous_total',)

    def sous_total(self, obj):
        return f"{obj.sous_total()} €"
    sous_total.short_description = "Sous-total"


class LigneFactureInline(admin.TabularInline):
    model = LigneFacture
    extra = 0
    readonly_fields = ('sous_total',)

    def sous_total(self, obj):
        return f"{obj.sous_total()} €"
    sous_total.short_description = "Sous-total"


# --- Admin Devis ---

@admin.register(Devis)
class DevisAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    list_display = ['numero', 'client', 'date_creation', 'date_validite', 'montant_ttc', 'statut']
    list_filter = ['statut', 'date_creation']
    search_fields = ['numero', 'client__nom']
    readonly_fields = ['numero', 'date_creation', 'montant_ht', 'tva', 'montant_ttc']
    inlines = [LigneDevisInline]


# --- Admin Facture ---

@admin.register(Facture)
class FactureAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    list_display = ['numero', 'client', 'date_emission', 'montant_ttc', 'montant_paye', 'statut']
    list_filter = ['statut', 'date_emission']
    search_fields = ['numero', 'client__nom']
    readonly_fields = ['numero', 'date_emission', 'montant_ht', 'tva', 'montant_ttc']
    inlines = [LigneFactureInline]


# --- Admin Paramètres ---

@admin.register(ParametresFacturation)
class ParametresFacturationAdmin(admin.ModelAdmin):
    list_display = ['tva_pourcentage', 'numero_devis_actuel', 'numero_facture_actuel', 'updated_at']
    # Empêche de créer plusieurs instances
    def has_add_permission(self, request):
        return not ParametresFacturation.objects.exists()
