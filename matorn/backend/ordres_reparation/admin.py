# /backend/ordres_reparation/admin.py

from django.contrib import admin
from .models import OrdreReparation, LignePieceUtilisee, LigneIntervention
from archives.admin import SoftDeleteAdminMixin


class LignePieceUtiliseeInline(admin.TabularInline):
    model = LignePieceUtilisee
    extra = 1
    autocomplete_fields = ['piece']


class LigneInterventionInline(admin.TabularInline):
    model = LigneIntervention
    extra = 1
    autocomplete_fields = ['mecanicien']
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """
        Filtre manuellement le dropdown 'type_intervention' pour ne montrer
        que les Référentiels de catégorie TYPE_INTERVENTION.
        """
        if db_field.name == 'type_intervention':
            from referentiels.models import Referentiel
            kwargs['queryset'] = Referentiel.objects.filter(
                categorie='TYPE_INTERVENTION',
                actif=True,
            ).order_by('ordre')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

            

@admin.register(OrdreReparation)
class OrdreReparationAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
    """Admin pour les Ordres de Réparation, avec support corbeille/archives."""
    list_display = ['numero', 'date_ouverture', 'client', 'vehicule', 'statut']
    list_filter = ['statut', 'date_ouverture']
    search_fields = ['numero', 'client__nom', 'vehicule__immatriculation']
    readonly_fields = ['numero', 'cree_le', 'modifie_le']
    autocomplete_fields = ['client', 'vehicule', 'rdv']
    inlines = [LignePieceUtiliseeInline, LigneInterventionInline]