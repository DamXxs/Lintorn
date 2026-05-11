from django.contrib import admin
from .models import Referentiel

@admin.register(Referentiel)
class ReferentielAdmin(admin.ModelAdmin):
    list_display = ['categorie', 'valeur', 'label', 'icone', 'ordre', 'actif']
    list_filter  = ['categorie', 'actif']
    ordering     = ['categorie', 'ordre']
    list_editable = ['ordre', 'actif']  # Modifiable directement dans la liste
    search_fields = ['valeur', 'label']