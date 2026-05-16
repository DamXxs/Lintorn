# /backend/planning/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Intervention, Departement, Collaborateur
from .serializers import InterventionSerializer, DepartementSerializer, CollaborateurSerializer
from accounts.permissions import login_required_cookie


# =============================================================================
# VUES DÉPARTEMENT
# GET  /api/departements/          → liste (tous ou ?actif=true)
# POST /api/departements/          → créer
# GET/PUT/PATCH/DELETE /api/departements/<id>/
# =============================================================================

@api_view(['GET', 'POST'])
@login_required_cookie
def departement_list(request):
    if request.method == 'GET':
        departements = Departement.objects.all()
        if request.query_params.get('actif') == 'true':
            departements = departements.filter(actif=True)
        return Response(DepartementSerializer(departements, many=True).data)

    elif request.method == 'POST':
        serializer = DepartementSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@login_required_cookie
def departement_detail(request, pk):
    try:
        departement = Departement.objects.get(pk=pk)
    except Departement.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(DepartementSerializer(departement).data)

    elif request.method in ['PUT', 'PATCH']:
        partial = (request.method == 'PATCH')
        serializer = DepartementSerializer(departement, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        # Règle 1 : garder au moins 1 département actif
        if departement.actif and not Departement.objects.filter(actif=True).exclude(pk=pk).exists():
            return Response(
                {'error': "Impossible de supprimer le dernier département actif."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Règle 2 : ne pas supprimer si des interventions y sont rattachées
        if departement.interventions.exists():
            return Response(
                {'error': f"Ce département contient {departement.interventions.count()} intervention(s). "
                           "Réassignez-les avant de le supprimer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        departement.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =============================================================================
# VUES COLLABORATEUR
# GET  /api/collaborateurs/          → liste (tous ou ?actif=true)
# POST /api/collaborateurs/          → créer
# GET/PUT/PATCH/DELETE /api/collaborateurs/<id>/
# =============================================================================

@api_view(['GET', 'POST'])
@login_required_cookie
def collaborateur_list(request):
    if request.method == 'GET':
        collaborateurs = Collaborateur.objects.all()
        if request.query_params.get('actif') == 'true':
            collaborateurs = collaborateurs.filter(actif=True)
        return Response(CollaborateurSerializer(collaborateurs, many=True).data)

    elif request.method == 'POST':
        serializer = CollaborateurSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@login_required_cookie
def collaborateur_detail(request, pk):
    try:
        collaborateur = Collaborateur.objects.get(pk=pk)
    except Collaborateur.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(CollaborateurSerializer(collaborateur).data)

    elif request.method in ['PUT', 'PATCH']:
        partial = (request.method == 'PATCH')
        serializer = CollaborateurSerializer(collaborateur, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        collaborateur.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =============================================================================
# VUES INTERVENTION
# =============================================================================

@api_view(['GET', 'POST'])
@login_required_cookie
def intervention_list(request):
    if request.method == 'GET':
        interventions = Intervention.objects.select_related(
            'client', 'vehicule', 'departement'
        ).prefetch_related('collaborateurs')

        if request.query_params.get('vehicule'):
            interventions = interventions.filter(vehicule__id=request.query_params['vehicule'])
        if request.query_params.get('client'):
            interventions = interventions.filter(client__id=request.query_params['client'])
        if request.query_params.get('collaborateur'):
            interventions = interventions.filter(collaborateurs__id=request.query_params['collaborateur'])
        if request.query_params.get('departement'):
            interventions = interventions.filter(departement__id=request.query_params['departement'])

        return Response(InterventionSerializer(interventions, many=True).data)

    elif request.method == 'POST':
        serializer = InterventionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@login_required_cookie
def intervention_detail(request, pk):
    try:
        intervention = Intervention.objects.select_related(
            'client', 'vehicule', 'departement'
        ).prefetch_related('collaborateurs').get(pk=pk)
    except Intervention.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(InterventionSerializer(intervention).data)

    elif request.method == 'PUT':
        serializer = InterventionSerializer(intervention, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'PATCH':
        serializer = InterventionSerializer(intervention, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        intervention.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
