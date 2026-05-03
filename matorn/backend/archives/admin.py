# /backend/archives/admin.py
"""
Mixin admin pour gérer corbeille et archives dans le Django Admin.

Pour l'utiliser dans n'importe quel admin :
    @admin.register(MonModele)
    class MonModeleAdmin(SoftDeleteAdminMixin, admin.ModelAdmin):
        # ... ta config habituelle
"""

from django.contrib import admin
from django.contrib import messages
from django.utils.safestring import mark_safe

from .models import SuppressionBloqueeError


class EtatFilter(admin.SimpleListFilter):
    """
    Filtre latéral dans l'admin : Actif / Corbeille / Archives / Tous.
    """
    title = '📦 État'
    parameter_name = 'etat'
    
    def lookups(self, request, model_admin):
        return [
            ('actif',     '✅ Actifs'),
            ('corbeille', '🗑️ Corbeille'),
            ('archive',   '📦 Archives'),
            ('tous',      '👁️ Tous (actifs + corbeille + archives)'),
        ]
    
    def queryset(self, request, queryset):
        # On part de all_objects pour avoir accès à TOUS les enregistrements
        # (le manager par défaut filtre les soft-deleted)
        ModelClass = queryset.model
        
        valeur = self.value()
        
        if valeur == 'corbeille':
            return ModelClass.deleted_objects.all()
        elif valeur == 'archive':
            return ModelClass.archived_objects.all()
        elif valeur == 'tous':
            return ModelClass.all_objects.all()
        # 'actif' ou None par défaut → comportement normal (manager objects)
        return ModelClass.objects.all()


class SoftDeleteAdminMixin:
    """
    Mixin à ajouter à n'importe quel ModelAdmin pour activer :
    - Filtre par état (Actif / Corbeille / Archives)
    - Colonne "État" colorée
    - Actions personnalisées : restaurer, archiver, purger
    """
    
    # === CONFIG : on étend list_filter ===
    def get_list_filter(self, request):
        """Ajoute le filtre par état AVANT les autres filtres existants."""
        filters_actuels = list(super().get_list_filter(request))
        return [EtatFilter] + filters_actuels
    
    # === CONFIG : on étend list_display avec une colonne État ===
    def get_list_display(self, request):
        """Ajoute la colonne 'etat_badge' à la fin des colonnes affichées."""
        cols_actuelles = list(super().get_list_display(request))
        if 'etat_badge' not in cols_actuelles:
            cols_actuelles.append('etat_badge')
        return cols_actuelles
    
    @admin.display(description='État')
    def etat_badge(self, obj):
        """
        Affiche un badge coloré selon l'état.
    
        On utilise mark_safe car le HTML est 100% statique (pas de données utilisateur),
        donc pas de risque d'injection. mark_safe est plus simple que format_html
        quand on n'a aucune variable à formater dans la chaîne.
        """
        # Style commun pour les 3 badges (DRY : Don't Repeat Yourself)
        style_base = (
            'color:#fff;padding:3px 10px;border-radius:12px;'
            'font-size:11px;font-weight:600;'
        )
    
        if obj.is_deleted:
            return mark_safe(
                f'<span style="background:#e74c3c;{style_base}">🗑️ CORBEILLE</span>'
            )
    
        if obj.is_archived:
            return mark_safe(
                f'<span style="background:#7f8c8d;{style_base}">📦 ARCHIVÉ</span>'
            )
    
        return mark_safe(
            f'<span style="background:#27ae60;{style_base}">✅ ACTIF</span>'
        )
    
    # === ACTIONS PERSONNALISÉES ===
    actions = ['action_restaurer', 'action_archiver', 'action_purger']
    
    @admin.action(description='♻️ Restaurer (sortir corbeille/archives)')
    def action_restaurer(self, request, queryset):
        nb_restaures = 0
        for obj in queryset:
            if obj.is_deleted:
                obj.restore()
                nb_restaures += 1
            elif obj.is_archived:
                obj.unarchive()
                nb_restaures += 1
        
        messages.success(request, f"✅ {nb_restaures} élément(s) restauré(s)")
    
    @admin.action(description='📦 Archiver')
    def action_archiver(self, request, queryset):
        nb_archives = 0
        for obj in queryset:
            if not obj.is_archived and not obj.is_deleted:
                obj.archive()
                nb_archives += 1
        
        messages.success(request, f"📦 {nb_archives} élément(s) archivé(s)")
    
    @admin.action(description='🗑️ Mettre en corbeille (soft-delete)')
    def action_mettre_corbeille(self, request, queryset):
        nb_ok = 0
        nb_bloques = 0
        for obj in queryset:
            try:
                obj.soft_delete()
                nb_ok += 1
            except SuppressionBloqueeError as e:
                nb_bloques += 1
                messages.warning(request, f"⚠️ {obj} : {e.message}")
        
        if nb_ok:
            messages.success(request, f"🗑️ {nb_ok} élément(s) mis en corbeille")
        if nb_bloques:
            messages.error(request, f"❌ {nb_bloques} élément(s) bloqué(s) par des règles métier")
    
    @admin.action(description='💀 Supprimer DÉFINITIVEMENT (irréversible)')
    def action_purger(self, request, queryset):
        nb_purges = 0
        for obj in queryset:
            if obj.is_deleted:
                obj.hard_delete()
                nb_purges += 1
            else:
                messages.warning(
                    request,
                    f"⚠️ {obj} doit d'abord être en corbeille pour être purgé"
                )
        
        if nb_purges:
            messages.success(request, f"💀 {nb_purges} élément(s) supprimé(s) définitivement")




            # =============================================================================
# ⬇️  AJOUT À LA FIN DU FICHIER  ⬇️
# =============================================================================

from django.urls import path
from django.shortcuts import render
from django.contrib.admin import AdminSite
from django.utils import timezone
from datetime import timedelta

from .registry import MODELES_ARCHIVABLES, get_libelle


# =============================================================================
# VUE ADMIN UNIFIÉE : DASHBOARD ARCHIVES & CORBEILLE
# =============================================================================

def vue_archives_unifiee(request):
    """
    Vue admin custom qui agrège TOUS les éléments en corbeille et archives,
    tous modèles confondus.
    
    Affiche un tableau avec : Type, Libellé, Date, État, Actions.
    """
    # Filtres possibles via query params
    etat_filter = request.GET.get('etat', 'tous')  # 'corbeille', 'archive', 'tous'
    type_filter = request.GET.get('type', 'tous')  # 'client', 'vehicule', etc.
    
    elements = []
    
    # Détermine les types à parcourir
    types_a_parcourir = (
        [type_filter] if type_filter != 'tous'
        else MODELES_ARCHIVABLES.keys()
    )
    
    # Pour chaque type de modèle archivable
    for type_url in types_a_parcourir:
        if type_url not in MODELES_ARCHIVABLES:
            continue
        
        app_label, model_name, libelle = MODELES_ARCHIVABLES[type_url]
        
        # On récupère la classe du modèle dynamiquement
        from django.contrib.contenttypes.models import ContentType
        try:
            ct = ContentType.objects.get(app_label=app_label, model=model_name)
            ModelClass = ct.model_class()
        except ContentType.DoesNotExist:
            continue
        
        # On filtre selon l'état demandé
        if etat_filter == 'corbeille':
            queryset = ModelClass.deleted_objects.all()
        elif etat_filter == 'archive':
            queryset = ModelClass.archived_objects.all()
        else:
            # Tous : corbeille + archives
            queryset = ModelClass.all_objects.filter(
                is_deleted=True
            ) | ModelClass.all_objects.filter(
                is_archived=True
            )
        
        # On construit les infos pour le template
        for obj in queryset:
            # URL vers la fiche admin de l'objet
            admin_url = f"/admin/{app_label}/{model_name}/{obj.id}/change/"
            
            # Date pour le tri (corbeille ou archive)
            date_action = obj.deleted_at or obj.archived_at
            
            # État
            if obj.is_deleted:
                etat = 'corbeille'
                etat_label = '🗑️ Corbeille'
                etat_couleur = '#e74c3c'
                # Calcul des jours restants avant purge auto (8 jours)
                jours_restants = 8 - (timezone.now() - obj.deleted_at).days
            else:
                etat = 'archive'
                etat_label = '📦 Archivé'
                etat_couleur = '#7f8c8d'
                jours_restants = None
            
            elements.append({
                'type_url': type_url,
                'type_libelle': libelle,
                'id': obj.id,
                'libelle': str(obj),
                'date_action': date_action,
                'etat': etat,
                'etat_label': etat_label,
                'etat_couleur': etat_couleur,
                'admin_url': admin_url,
                'jours_restants': jours_restants,
            })
    
    # Tri : plus récents d'abord
    elements.sort(key=lambda x: x['date_action'] or timezone.now(), reverse=True)
    
    # Stats pour les cartes du haut
    nb_corbeille = sum(1 for e in elements if e['etat'] == 'corbeille')
    nb_archive = sum(1 for e in elements if e['etat'] == 'archive')
    
    # Liste des types pour le filtre dropdown
    types_disponibles = [
        {'cle': cle, 'libelle': libelle}
        for cle, (_, _, libelle) in MODELES_ARCHIVABLES.items()
    ]
    
    contexte = {
        'title': '📦 Archives & Corbeille',
        'elements': elements,
        'nb_total': len(elements),
        'nb_corbeille': nb_corbeille,
        'nb_archive': nb_archive,
        'etat_filter': etat_filter,
        'type_filter': type_filter,
        'types_disponibles': types_disponibles,
        # Variables nécessaires pour que le template admin Django fonctionne
        'site_header': 'Administration Matorn',
        'site_title': 'Matorn Admin',
        'has_permission': request.user.is_authenticated and request.user.is_staff,
        'available_apps': [],  # Évite une erreur sur certaines versions de Django
    }
    
    return render(request, 'admin/archives_dashboard.html', contexte)


# =============================================================================
# ENREGISTREMENT DE LA VUE DANS L'ADMIN
# On "monkey-patch" l'admin pour ajouter notre URL custom.
# =============================================================================

def get_admin_urls(original_get_urls):
    """
    Décorateur qui ajoute notre vue custom aux URLs de l'admin.
    """
    def get_urls():
        custom_urls = [
            path(
                'archives-corbeille/',
                admin.site.admin_view(vue_archives_unifiee),
                name='archives_dashboard'
            ),
        ]
        # On met nos URLs AVANT les URLs standards de l'admin
        return custom_urls + original_get_urls()
    return get_urls


# Application du patch
admin.site.get_urls = get_admin_urls(admin.site.get_urls)