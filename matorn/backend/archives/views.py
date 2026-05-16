# /backend/archives/views.py
"""
Endpoints API centralisés pour la gestion de la corbeille et des archives.

5 endpoints :
- GET  /api/archives/                    → Liste tous les éléments archivés/en corbeille
- GET  /api/archives/corbeille/          → Liste seulement la corbeille
- GET  /api/archives/archives/           → Liste seulement les archives
- POST /api/archives/<type>/<id>/restore/  → Restaure un élément
- DELETE /api/archives/<type>/<id>/purge/  → Supprime définitivement
"""

from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .registry import MODELES_ARCHIVABLES, get_model_class, get_libelle
from .serializers import serialiser_element
from accounts.permissions import require_role


# =============================================================================
# HELPER : récupère un objet depuis le registre
# =============================================================================
def _get_object_or_none(type_url, pk):
    """
    Récupère un objet depuis n'importe quel modèle archivable.
    Utilise all_objects pour pouvoir trouver les éléments en corbeille/archives.
    """
    try:
        ModelClass = get_model_class(type_url)
        # all_objects ignore les filtres de soft-delete
        return ModelClass.all_objects.get(pk=pk)
    except (ValueError, ModelClass.DoesNotExist):
        return None


# =============================================================================
# ENDPOINT 1 : LISTING UNIFIÉ
# GET /api/archives/                          → tout
# GET /api/archives/?etat=corbeille          → corbeille uniquement
# GET /api/archives/?etat=archive            → archives uniquement
# GET /api/archives/?type=client             → un type uniquement
# GET /api/archives/?etat=corbeille&type=client → combiné
# =============================================================================
@api_view(['GET'])
@require_role('superuser')
def archives_list(request):
    """
    Liste tous les éléments en corbeille ou archives, tous modèles confondus.
    
    Filtres optionnels :
    - ?etat=corbeille | archive
    - ?type=client | vehicule | rdv | piece | fournisseur | devis | facture
    """
    etat_filter = request.query_params.get('etat')   # 'corbeille', 'archive', ou None
    type_filter = request.query_params.get('type')   # 'client', 'vehicule', ... ou None
    
    resultats = []
    
    # Détermine les types à parcourir
    types_a_parcourir = [type_filter] if type_filter else MODELES_ARCHIVABLES.keys()
    
    for type_url in types_a_parcourir:
        try:
            ModelClass = get_model_class(type_url)
        except ValueError:
            continue  # Type inconnu → on skip
        
        type_libelle = get_libelle(type_url)
        
        # On utilise les Managers spécialisés selon le filtre
        if etat_filter == 'corbeille':
            queryset = ModelClass.deleted_objects.all()
        elif etat_filter == 'archive':
            queryset = ModelClass.archived_objects.all()
        else:
            # Tout : corbeille + archives
            queryset = ModelClass.all_objects.filter(
                is_deleted=True
            ) | ModelClass.all_objects.filter(
                is_archived=True
            )
        
        # On sérialise chaque élément
        for obj in queryset:
            resultats.append(serialiser_element(obj, type_url, type_libelle))
    
    # Tri : plus récents d'abord (par date corbeille ou archive)
    resultats.sort(
        key=lambda x: x['deleted_at'] or x['archived_at'],
        reverse=True
    )
    
    return Response({
        'count': len(resultats),
        'results': resultats,
    })


# =============================================================================
# ENDPOINT 2 : RESTAURATION
# POST /api/archives/<type>/<id>/restore/
# =============================================================================
@api_view(['POST'])
@require_role('superuser')
def restore_element(request, type_url, pk):
    """
    Restaure un élément depuis la corbeille OU les archives.
    Le rend à nouveau "actif" (visible dans les vues principales).
    """
    obj = _get_object_or_none(type_url, pk)
    
    if obj is None:
        return Response(
            {'error': 'Élément introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # On détermine si c'est une restauration depuis corbeille ou archives
    if obj.is_deleted:
        obj.restore()
        action = 'restauré depuis la corbeille'
    elif obj.is_archived:
        obj.unarchive()
        action = 'sorti des archives'
    else:
        return Response(
            {'error': 'Cet élément est déjà actif'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    return Response({
        'message': f"{get_libelle(type_url)} {action} avec succès",
        'id': obj.id,
        'type': type_url,
    })


# =============================================================================
# ENDPOINT 3 : PURGE DÉFINITIVE (irréversible !)
# DELETE /api/archives/<type>/<id>/purge/
# =============================================================================
@api_view(['DELETE'])
@require_role('superuser')
def purge_element(request, type_url, pk):
    """
    Supprime DÉFINITIVEMENT un élément de la base de données.
    Action IRRÉVERSIBLE — à utiliser avec précaution.
    
    Sécurité : on ne purge QUE les éléments déjà en corbeille.
    Impossible de purger un élément actif directement.
    """
    obj = _get_object_or_none(type_url, pk)
    
    if obj is None:
        return Response(
            {'error': 'Élément introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Sécurité : on n'autorise la purge que pour les éléments en corbeille
    if not obj.is_deleted:
        return Response(
            {'error': 'Cet élément doit d\'abord être en corbeille pour être purgé'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    obj.hard_delete()
    
    return Response(status=status.HTTP_204_NO_CONTENT)


# =============================================================================
# ENDPOINT 4 : INFO SUR LES TYPES DISPONIBLES
# GET /api/archives/types/
# Utile pour le frontend : récupérer la liste des filtres disponibles
# =============================================================================
@api_view(['GET'])
@require_role('superuser')
def types_archivables(request):
    """
    Retourne la liste des types de modèles archivables.
    Permet au frontend de construire dynamiquement les filtres.
    """
    types = [
        {
            'cle': cle,
            'libelle': libelle,
        }
        for cle, (_, _, libelle) in MODELES_ARCHIVABLES.items()
    ]
    return Response(types)