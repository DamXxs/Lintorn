# /backend/planning/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Intervention
from .serializers import InterventionSerializer

@api_view(['GET', 'POST'])
def intervention_list(request):
    if request.method == 'GET':
        interventions = Intervention.objects.all()
        vehicule_id = request.query_params.get('vehicule', None)
        if vehicule_id:
          interventions = interventions.filter(vehicule__id=vehicule_id)
        serializer = InterventionSerializer(interventions, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = InterventionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def intervention_detail(request, pk):
    try:
        intervention = Intervention.objects.get(pk=pk)
    except Intervention.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = InterventionSerializer(intervention)
        return Response(serializer.data)

    elif request.method == 'PUT':
        # Mise à jour complète
        serializer = InterventionSerializer(intervention, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'PATCH':
        # ✅ Mise à jour PARTIELLE (ex: juste le statut)
        # partial=True → seuls les champs envoyés sont mis à jour
        serializer = InterventionSerializer(intervention, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        intervention.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)