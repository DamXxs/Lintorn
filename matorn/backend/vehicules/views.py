# /backend/vehicules/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Vehicule
from .serializers import VehiculeSerializer
from accounts.permissions import login_required_cookie


# =============================================================================
# LISTE + CRÉATION
# GET  /api/vehicules/   → retourne tous les véhicules
# POST /api/vehicules/   → crée un nouveau véhicule
# =============================================================================
@api_view(['GET', 'POST'])
@login_required_cookie
def vehicule_list(request):

    if request.method == 'GET':
        vehicules = Vehicule.objects.select_related('proprietaire').all()

        # Recherche optionnelle : /api/vehicules/?search=peugeot
        search = request.query_params.get('search', None)
        if search:
            vehicules = vehicules.filter(
                immatriculation__icontains=search
            ) | vehicules.filter(
                marque__icontains=search
            ) | vehicules.filter(
                modele__icontains=search
            ) | vehicules.filter(
                proprietaire__nom__icontains=search
            )

        # Filtre par client : /api/vehicules/?client=42
        client_id = request.query_params.get('client', None)
        if client_id:
            vehicules = vehicules.filter(proprietaire__id=client_id)

        serializer = VehiculeSerializer(vehicules, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = VehiculeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# DÉTAIL + MODIFICATION + SUPPRESSION
# GET    /api/vehicules/42/   → retourne le véhicule 42
# PUT    /api/vehicules/42/   → modifie complètement
# PATCH  /api/vehicules/42/   → modifie partiellement
# DELETE /api/vehicules/42/   → supprime
# =============================================================================
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@login_required_cookie
def vehicule_detail(request, pk):

    try:
        vehicule = Vehicule.objects.select_related('proprietaire').get(pk=pk)
    except Vehicule.DoesNotExist:
        return Response(
            {'error': 'Véhicule introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = VehiculeSerializer(vehicule)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = VehiculeSerializer(vehicule, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'PATCH':
        serializer = VehiculeSerializer(vehicule, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        vehicule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)