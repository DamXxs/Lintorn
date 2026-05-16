# /backend/ordres_reparation/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .models import OrdreReparation, LignePieceUtilisee, LigneIntervention
from accounts.permissions import login_required_cookie
from .serializers import (
    OrdreReparationListSerializer,
    OrdreReparationDetailSerializer,
    LignePieceUtiliseeSerializer,
    LigneInterventionSerializer,
)


# =============================================================================
# LISTE + CRÉATION D'UN OR
# GET  /api/ordres-reparation/        → liste tous les OR
# POST /api/ordres-reparation/        → crée un OR
# =============================================================================
@api_view(['GET', 'POST'])
@login_required_cookie
def ordre_reparation_list(request):
    
    if request.method == 'GET':
        # select_related + prefetch_related = optimisation des requêtes BDD
        # → 1 grosse requête au lieu de N+1 petites
        ordres = OrdreReparation.objects.select_related(
            'client', 'vehicule', 'rdv'
        ).all()
        
        # Filtres optionnels (utiles côté React)
        statut = request.query_params.get('statut')
        if statut:
            ordres = ordres.filter(statut=statut)
        
        client_id = request.query_params.get('client')
        if client_id:
            ordres = ordres.filter(client_id=client_id)
        
        vehicule_id = request.query_params.get('vehicule')
        if vehicule_id:
            ordres = ordres.filter(vehicule_id=vehicule_id)
        
        # Recherche par numéro d'OR
        search = request.query_params.get('search')
        if search:
            ordres = ordres.filter(numero__icontains=search)
        
        # On utilise le serializer LISTE (allégé)
        serializer = OrdreReparationListSerializer(ordres, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # Pour la création, on utilise le serializer DÉTAIL
        serializer = OrdreReparationDetailSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# DÉTAIL + MODIFICATION + SUPPRESSION D'UN OR
# GET    /api/ordres-reparation/42/   → détail complet
# PUT    /api/ordres-reparation/42/   → modif complète
# PATCH  /api/ordres-reparation/42/   → modif partielle
# DELETE /api/ordres-reparation/42/   → soft-delete (corbeille)
# =============================================================================
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@login_required_cookie
def ordre_reparation_detail(request, pk):
    
    try:
        # On charge tout d'un coup (optimisation)
        ordre = OrdreReparation.objects.select_related(
            'client', 'vehicule', 'rdv'
        ).prefetch_related(
            'pieces__piece',  # pré-charge les pièces et leurs FK
            'interventions__type_intervention',
            'interventions__mecanicien',
        ).get(pk=pk)
    except OrdreReparation.DoesNotExist:
        return Response(
            {'error': 'Ordre de réparation introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        serializer = OrdreReparationDetailSerializer(ordre)
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        # Empêche modif si déjà clôturé
        if ordre.statut == OrdreReparation.STATUT_CLOTURE:
            return Response(
                {'error': 'Cet OR est clôturé et ne peut plus être modifié.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        partial = (request.method == 'PATCH')
        serializer = OrdreReparationDetailSerializer(
            ordre, data=request.data, partial=partial
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Soft-delete (corbeille) grâce à SoftDeleteMixin
        # Si l'OR est clôturé+facturé, check_can_be_deleted lèvera une exception
        try:
            ordre.delete()  # appelle soft_delete() automatiquement
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            # Si SuppressionBloqueeError → on remonte les infos au frontend
            if hasattr(e, 'elements_bloquants'):
                return Response(
                    {
                        'error': e.message,
                        'elements_bloquants': e.elements_bloquants,
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
            # Autre erreur inattendue
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


# =============================================================================
# ACTION : CLÔTURER UN OR
# POST /api/ordres-reparation/42/cloturer/
# Body : { "kilometrage_sortie": 142500, "heure_sortie": "17:30" }
# =============================================================================
@api_view(['POST'])
@login_required_cookie
def ordre_reparation_cloturer(request, pk):
    """Marque un OR comme clôturé avec les infos de fin d'intervention."""
    from datetime import date
    
    try:
        ordre = OrdreReparation.objects.get(pk=pk)
    except OrdreReparation.DoesNotExist:
        return Response(
            {'error': 'OR introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if ordre.statut == OrdreReparation.STATUT_CLOTURE:
        return Response(
            {'error': 'Cet OR est déjà clôturé.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    ordre.statut = OrdreReparation.STATUT_CLOTURE
    ordre.date_cloture = date.today()
    
    # Optionnels depuis le body
    if 'kilometrage_sortie' in request.data:
        ordre.kilometrage_sortie = request.data['kilometrage_sortie']
    if 'heure_sortie' in request.data:
        ordre.heure_sortie = request.data['heure_sortie']
    
    ordre.save()

    serializer = OrdreReparationDetailSerializer(ordre)
    return Response(serializer.data)


# =============================================================================
# ACTION : DÉCLÔTURER UN OR
# POST /api/ordres-reparation/42/decloturer/
# Bloqué si la facture liée est entièrement payée.
# =============================================================================
@api_view(['POST'])
@login_required_cookie
def ordre_reparation_decloturer(request, pk):
    try:
        ordre = OrdreReparation.objects.select_related('rdv').get(pk=pk)
    except OrdreReparation.DoesNotExist:
        return Response({'error': 'OR introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if ordre.statut != OrdreReparation.STATUT_CLOTURE:
        return Response(
            {'error': 'Cet OR n\'est pas clôturé.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Blocage si facture intégralement payée
    if ordre.rdv and ordre.rdv.factures.filter(statut='PAYEE').exists():
        return Response(
            {'error': 'Impossible de déclôturer cet OR : la facture associée a été réglée en totalité.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    ordre.statut = OrdreReparation.STATUT_EN_COURS
    ordre.date_cloture = None
    ordre.save()

    serializer = OrdreReparationDetailSerializer(ordre)
    return Response(serializer.data)


# =============================================================================
# LIGNES PIÈCES — gérées séparément (CRUD complet)
# GET  /api/ordres-reparation/42/pieces/        → liste des pièces de l'OR 42
# POST /api/ordres-reparation/42/pieces/        → ajoute une pièce
# =============================================================================
@api_view(['GET', 'POST'])
@login_required_cookie
def ligne_piece_list(request, ordre_id):
    
    try:
        ordre = OrdreReparation.objects.get(pk=ordre_id)
    except OrdreReparation.DoesNotExist:
        return Response(
            {'error': 'OR introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        pieces = ordre.pieces.select_related('piece').all()
        serializer = LignePieceUtiliseeSerializer(pieces, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        # On valide les données reçues
        serializer = LignePieceUtiliseeSerializer(data=request.data)
        if serializer.is_valid():
            # Récupérer la pièce pour faire les snapshots automatiquement
            from stock.models import Piece
            piece_id = serializer.validated_data['piece'].id
            
            try:
                piece = Piece.objects.get(pk=piece_id)
            except Piece.DoesNotExist:
                return Response(
                    {'error': 'Pièce introuvable dans le stock'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # On sauvegarde avec l'OR + les snapshots auto-remplis
            ligne = serializer.save(
                ordre_reparation=ordre,
                designation_snapshot=piece.nom,
                reference_snapshot=piece.reference,
            )
            
            return Response(
                LignePieceUtiliseeSerializer(ligne).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# DÉTAIL/MODIF/SUPPRESSION D'UNE LIGNE PIÈCE
# GET/PUT/PATCH/DELETE /api/ordres-reparation/lignes-pieces/<id>/
# =============================================================================
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@login_required_cookie
def ligne_piece_detail(request, pk):
    
    try:
        ligne = LignePieceUtilisee.objects.select_related(
            'piece', 'ordre_reparation'
        ).get(pk=pk)
    except LignePieceUtilisee.DoesNotExist:
        return Response(
            {'error': 'Ligne pièce introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        return Response(LignePieceUtiliseeSerializer(ligne).data)
    
    elif request.method in ['PUT', 'PATCH']:
        partial = (request.method == 'PATCH')
        serializer = LignePieceUtiliseeSerializer(
            ligne, data=request.data, partial=partial
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        ligne.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =============================================================================
# LIGNES INTERVENTIONS — même pattern que pour les pièces
# =============================================================================
@api_view(['GET', 'POST'])
@login_required_cookie
def ligne_intervention_list(request, ordre_id):
    
    try:
        ordre = OrdreReparation.objects.get(pk=ordre_id)
    except OrdreReparation.DoesNotExist:
        return Response(
            {'error': 'OR introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        interventions = ordre.interventions.select_related(
            'type_intervention', 'mecanicien'
        ).all()
        serializer = LigneInterventionSerializer(interventions, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = LigneInterventionSerializer(data=request.data)
        if serializer.is_valid():
            ligne = serializer.save(ordre_reparation=ordre)
            return Response(
                LigneInterventionSerializer(ligne).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@login_required_cookie
def ligne_intervention_detail(request, pk):
    
    try:
        ligne = LigneIntervention.objects.select_related(
            'type_intervention', 'mecanicien', 'ordre_reparation'
        ).get(pk=pk)
    except LigneIntervention.DoesNotExist:
        return Response(
            {'error': 'Intervention introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    if request.method == 'GET':
        return Response(LigneInterventionSerializer(ligne).data)
    
    elif request.method in ['PUT', 'PATCH']:
        partial = (request.method == 'PATCH')
        serializer = LigneInterventionSerializer(
            ligne, data=request.data, partial=partial
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        ligne.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)