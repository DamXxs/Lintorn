# /backend/clients/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Client
from .serializers import ClientSerializer
from accounts.permissions import login_required_cookie


# =============================================================================
# LISTE + CRÉATION
# GET  /api/clients/     → retourne tous les clients
# POST /api/clients/     → crée un nouveau client
# =============================================================================
@api_view(['GET', 'POST'])
@login_required_cookie
def client_list(request):

    if request.method == 'GET':
        # Récupère tous les clients (triés par nom grâce au Meta.ordering du modèle)
        clients = Client.objects.all()

        # Paramètre de recherche optionnel : /api/clients/?search=dupont
        search = request.query_params.get('search', None)
        if search:
            clients = clients.filter(
                # icontains = "contient" sans tenir compte des majuscules
                nom__icontains=search
            ) | clients.filter(
                prenom__icontains=search
            ) | clients.filter(
                telephone__icontains=search
            ) | clients.filter(
                email__icontains=search
            )

        # many=True car on sérialise une LISTE de clients (pas un seul)
        serializer = ClientSerializer(clients, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        # request.data = le JSON envoyé par React
        serializer = ClientSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save()   # ← Crée le client en BDD
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # Si les données sont invalides, renvoie les erreurs
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# DÉTAIL + MODIFICATION + SUPPRESSION
# GET    /api/clients/42/   → retourne le client avec l'ID 42
# PUT    /api/clients/42/   → modifie complètement le client 42
# PATCH  /api/clients/42/   → modifie partiellement le client 42
# DELETE /api/clients/42/   → supprime le client 42
# =============================================================================
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@login_required_cookie
def client_detail(request, pk):

    # D'abord, on vérifie que le client existe
    try:
        client = Client.objects.get(pk=pk)
    except Client.DoesNotExist:
        return Response(
            {'error': 'Client introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = ClientSerializer(client)
        return Response(serializer.data)

    elif request.method == 'PUT':
        # Mise à jour COMPLÈTE (tous les champs obligatoires)
        serializer = ClientSerializer(client, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'PATCH':
        # Mise à jour PARTIELLE (seulement les champs envoyés)
        serializer = ClientSerializer(client, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        client.delete()
        # 204 = succès mais pas de contenu à renvoyer
        return Response(status=status.HTTP_204_NO_CONTENT)