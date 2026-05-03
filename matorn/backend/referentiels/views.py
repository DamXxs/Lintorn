# /backend/referentiels/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Referentiel
from .serializers import ReferentielSerializer


@api_view(['GET', 'POST'])
def referentiel_list(request):
    """
    GET  /api/referentiels/                     → tous les référentiels
    GET  /api/referentiels/?categorie=TYPE_VEHICULE → filtrés par catégorie
    POST /api/referentiels/                     → créer un nouveau
    """

    if request.method == 'GET':
        referentiels = Referentiel.objects.all()

        # Filtre optionnel par catégorie
        categorie = request.query_params.get('categorie', None)
        if categorie:
            referentiels = referentiels.filter(categorie=categorie)

        # Filtre optionnel actifs uniquement
        actif_only = request.query_params.get('actif', None)
        if actif_only == 'true':
            referentiels = referentiels.filter(actif=True)

        serializer = ReferentielSerializer(referentiels, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = ReferentielSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def referentiel_detail(request, pk):
    """
    GET    /api/referentiels/42/ → détail
    PUT    /api/referentiels/42/ → modification complète
    PATCH  /api/referentiels/42/ → modification partielle (ex: juste actif)
    DELETE /api/referentiels/42/ → suppression
    """

    try:
        referentiel = Referentiel.objects.get(pk=pk)
    except Referentiel.DoesNotExist:
        return Response(
            {'error': 'Référentiel introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = ReferentielSerializer(referentiel)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = ReferentielSerializer(referentiel, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'PATCH':
        # Utilisé pour : toggle actif, changer ordre, modifier label/icône
        serializer = ReferentielSerializer(referentiel, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        referentiel.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)