# /backend/planning/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Intervention
from .serializers import InterventionSerializer

@api_view(['GET', 'POST'])
def intervention_list(request):
    """
    Liste toutes les interventions (GET) ou crée une nouvelle (POST)
    """
    if request.method == 'GET':
        interventions = Intervention.objects.all()
        serializer = InterventionSerializer(interventions, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = InterventionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
def intervention_detail(request, pk):
    """
    Récupère, modifie ou supprime une intervention spécifique
    """
    try:
        intervention = Intervention.objects.get(pk=pk)
    except Intervention.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = InterventionSerializer(intervention)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = InterventionSerializer(intervention, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        intervention.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)