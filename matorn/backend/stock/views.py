# /backend/stock/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from .models import Piece
from .serializers import PieceSerializer
from accounts.permissions import login_required_cookie


# =============================================================================
# LISTE + CRÉATION
# GET  /api/stock/pieces/   → retourne toutes les pièces
# POST /api/stock/pieces/   → crée une nouvelle pièce
# =============================================================================
@api_view(['GET', 'POST'])
@login_required_cookie
def piece_list(request):

    if request.method == 'GET':
        pieces = Piece.objects.all()

        # Recherche optionnelle : /api/stock/pieces/?search=filtre
        search = request.query_params.get('search', None)
        if search:
            pieces = pieces.filter(
                Q(nom__icontains=search) |
                Q(reference__icontains=search)
            )

        # Filtre par catégorie : /api/stock/pieces/?categorie=FILTRATION
        categorie = request.query_params.get('categorie', None)
        if categorie:
            pieces = pieces.filter(categorie=categorie)

        # Filtre par statut de stock : /api/stock/pieces/?statut=ALERTE
        # On filtre après sérialisation car stock_status est une @property
        serializer = PieceSerializer(pieces, many=True)
        data = serializer.data

        statut = request.query_params.get('statut', None)
        if statut:
            data = [p for p in data if p['stock_status'] == statut]

        return Response(data)

    elif request.method == 'POST':
        serializer = PieceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# DÉTAIL + MODIFICATION + SUPPRESSION
# GET    /api/stock/pieces/42/   → retourne la pièce 42
# PUT    /api/stock/pieces/42/   → modifie complètement la pièce 42
# PATCH  /api/stock/pieces/42/   → modifie partiellement (ex: stock_actuel)
# DELETE /api/stock/pieces/42/   → supprime la pièce 42
# =============================================================================
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@login_required_cookie
def piece_detail(request, pk):

    try:
        piece = Piece.objects.get(pk=pk)
    except Piece.DoesNotExist:
        return Response(
            {'error': 'Pièce introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = PieceSerializer(piece)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = PieceSerializer(piece, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'PATCH':
        # Utile pour mettre à jour juste le stock_actuel (ex: après une intervention)
        serializer = PieceSerializer(piece, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        piece.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
