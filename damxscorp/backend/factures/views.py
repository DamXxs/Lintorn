# /backend/factures/views.py
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import ParametresFacturation, ForfaitIntervention, Devis, LigneDevis, Facture, LigneFacture
from .serializers import (
    ParametresFacturationSerializer,
    ForfaitInterventionSerializer,
    DevisListSerializer, DevisDetailSerializer,
    LigneDevisSerializer, LigneDevisCreateSerializer,
    FactureListSerializer, FactureDetailSerializer,
    LigneFactureSerializer, LigneFactureCreateSerializer,
)


# =============================================================================
# PARAMÈTRES FACTURATION
# GET    /api/factures/parametres/  → lire les paramètres
# PATCH  /api/factures/parametres/  → modifier le taux TVA
# =============================================================================

@api_view(['GET', 'PATCH'])
def parametres_view(request):
    # Toujours travailler sur le singleton pk=1
    params, _ = ParametresFacturation.objects.get_or_create(pk=1)

    if request.method == 'GET':
        return Response(ParametresFacturationSerializer(params).data)

    elif request.method == 'PATCH':
        serializer = ParametresFacturationSerializer(params, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# FORFAITS INTERVENTION
# GET  /api/factures/forfaits/       → liste (actifs seulement par défaut)
# POST /api/factures/forfaits/       → créer
# GET/PUT/PATCH/DELETE /api/factures/forfaits/<id>/
# =============================================================================

@api_view(['GET', 'POST'])
def forfait_list(request):
    if request.method == 'GET':
        # Par défaut, renvoyer uniquement les forfaits actifs
        # Paramètre ?tous=1 pour voir aussi les inactifs (dans les paramètres)
        if request.query_params.get('tous'):
            forfaits = ForfaitIntervention.objects.all()
        else:
            forfaits = ForfaitIntervention.objects.filter(actif=True)
        return Response(ForfaitInterventionSerializer(forfaits, many=True).data)

    elif request.method == 'POST':
        serializer = ForfaitInterventionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def forfait_detail(request, pk):
    try:
        forfait = ForfaitIntervention.objects.get(pk=pk)
    except ForfaitIntervention.DoesNotExist:
        return Response({'error': 'Forfait introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(ForfaitInterventionSerializer(forfait).data)

    elif request.method in ['PUT', 'PATCH']:
        partial = (request.method == 'PATCH')
        serializer = ForfaitInterventionSerializer(forfait, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        forfait.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =============================================================================
# DEVIS
# GET  /api/factures/devis/       → liste
# POST /api/factures/devis/       → créer
# GET/PUT/PATCH/DELETE /api/factures/devis/<id>/
# =============================================================================

@api_view(['GET', 'POST'])
def devis_list(request):
    if request.method == 'GET':
        devis = Devis.objects.select_related('client', 'intervention').all()

        # Filtres optionnels via query params
        statut = request.query_params.get('statut')
        if statut:
            devis = devis.filter(statut=statut)

        client_id = request.query_params.get('client')
        if client_id:
            devis = devis.filter(client_id=client_id)

        return Response(DevisListSerializer(devis, many=True).data)

    elif request.method == 'POST':
        serializer = DevisDetailSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def devis_detail(request, pk):
    try:
        devis = Devis.objects.select_related('client', 'intervention').prefetch_related(
            'lignes_devis__piece'
        ).get(pk=pk)
    except Devis.DoesNotExist:
        return Response({'error': 'Devis introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(DevisDetailSerializer(devis).data)

    elif request.method in ['PUT', 'PATCH']:
        # Un devis facturé ne peut plus être modifié
        if devis.statut == 'FACTURE':
            return Response(
                {'error': 'Ce devis est déjà facturé, il ne peut plus être modifié.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        partial = (request.method == 'PATCH')
        serializer = DevisDetailSerializer(devis, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        if devis.statut == 'FACTURE':
            return Response(
                {'error': 'Impossible de supprimer un devis déjà facturé.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        # Libérer le stock suspendu avant suppression
        devis.liberer_stock_suspendu()
        devis.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =============================================================================
# ACTIONS DEVIS
# POST /api/factures/devis/<id>/valider/
# POST /api/factures/devis/<id>/refuser/
# POST /api/factures/devis/<id>/creer-facture/
# =============================================================================

@api_view(['POST'])
def devis_valider(request, pk):
    """Marque le devis comme validé par le client"""
    try:
        devis = Devis.objects.get(pk=pk)
    except Devis.DoesNotExist:
        return Response({'error': 'Devis introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if devis.statut not in ['CREE']:
        return Response(
            {'error': f'Impossible de valider un devis avec le statut "{devis.get_statut_display()}".'},
            status=status.HTTP_400_BAD_REQUEST
        )

    devis.statut = 'VALIDE'
    devis.save()
    return Response(DevisDetailSerializer(devis).data)


@api_view(['POST'])
def devis_refuser(request, pk):
    """Marque le devis comme refusé et libère le stock suspendu"""
    try:
        devis = Devis.objects.get(pk=pk)
    except Devis.DoesNotExist:
        return Response({'error': 'Devis introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if devis.statut not in ['CREE', 'VALIDE']:
        return Response(
            {'error': f'Impossible de refuser un devis avec le statut "{devis.get_statut_display()}".'},
            status=status.HTTP_400_BAD_REQUEST
        )

    devis.statut = 'REFUSE'
    devis.liberer_stock_suspendu()
    devis.save()
    return Response(DevisDetailSerializer(devis).data)


@api_view(['POST'])
def devis_creer_facture(request, pk):
    """
    Crée une facture à partir d'un devis validé.
    - Copie les lignes du devis dans la facture
    - Consomme le stock des pièces (stock_actuel - quantite)
    - Passe le devis au statut FACTURE
    """
    try:
        devis = Devis.objects.prefetch_related('lignes_devis__piece').get(pk=pk)
    except Devis.DoesNotExist:
        return Response({'error': 'Devis introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if devis.statut != 'VALIDE':
        return Response(
            {'error': 'Seul un devis validé peut être converti en facture.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Récupérer la date d'échéance depuis le body (obligatoire)
    date_echeance = request.data.get('date_echeance')
    if not date_echeance:
        return Response(
            {'error': 'La date d\'échéance est obligatoire pour créer la facture.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    notes = request.data.get('notes', devis.notes or '')

    # Créer la facture
    facture = Facture.objects.create(
        client=devis.client,
        devis=devis,
        intervention=devis.intervention,
        date_echeance=date_echeance,
        notes=notes,
    )

    # Copier les lignes du devis dans la facture
    for ligne in devis.lignes_devis.all():
        LigneFacture.objects.create(
            facture=facture,
            piece=ligne.piece,
            description=ligne.description,
            quantite=ligne.quantite,
            prix_unitaire=ligne.prix_unitaire,
        )

    # Consommer le stock (stock_actuel diminue, stock_suspendu libéré)
    devis.consommer_stock()

    # Marquer le devis comme facturé
    devis.statut = 'FACTURE'
    devis.save()

    # Recalculer les montants de la facture
    facture.calculer_montants()

    return Response(FactureDetailSerializer(facture).data, status=status.HTTP_201_CREATED)


# =============================================================================
# LIGNES DEVIS
# GET  /api/factures/devis/<devis_id>/lignes/   → liste
# POST /api/factures/devis/<devis_id>/lignes/   → ajouter une ligne
# GET/PUT/PATCH/DELETE /api/factures/lignes-devis/<id>/
# =============================================================================

@api_view(['GET', 'POST'])
def ligne_devis_list(request, devis_id):
    try:
        devis = Devis.objects.get(pk=devis_id)
    except Devis.DoesNotExist:
        return Response({'error': 'Devis introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        lignes = devis.lignes_devis.select_related('piece').all()
        return Response(LigneDevisSerializer(lignes, many=True).data)

    elif request.method == 'POST':
        serializer = LigneDevisCreateSerializer(data=request.data)
        if serializer.is_valid():
            ligne = serializer.save(devis=devis)
            return Response(LigneDevisSerializer(ligne).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def ligne_devis_detail(request, pk):
    try:
        ligne = LigneDevis.objects.select_related('piece', 'devis').get(pk=pk)
    except LigneDevis.DoesNotExist:
        return Response({'error': 'Ligne introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(LigneDevisSerializer(ligne).data)

    elif request.method in ['PUT', 'PATCH']:
        partial = (request.method == 'PATCH')
        serializer = LigneDevisCreateSerializer(ligne, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(LigneDevisSerializer(ligne).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        ligne.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =============================================================================
# FACTURES
# GET  /api/factures/factures/       → liste
# POST /api/factures/factures/       → créer
# GET/PUT/PATCH/DELETE /api/factures/factures/<id>/
# =============================================================================

@api_view(['GET', 'POST'])
def facture_list(request):
    if request.method == 'GET':
        factures = Facture.objects.select_related('client', 'devis', 'intervention').all()

        statut = request.query_params.get('statut')
        if statut:
            factures = factures.filter(statut=statut)

        client_id = request.query_params.get('client')
        if client_id:
            factures = factures.filter(client_id=client_id)

        return Response(FactureListSerializer(factures, many=True).data)

    elif request.method == 'POST':
        serializer = FactureDetailSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def facture_detail(request, pk):
    try:
        facture = Facture.objects.select_related(
            'client', 'devis', 'intervention'
        ).prefetch_related('lignes_facture__piece').get(pk=pk)
    except Facture.DoesNotExist:
        return Response({'error': 'Facture introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(FactureDetailSerializer(facture).data)

    elif request.method in ['PUT', 'PATCH']:
        partial = (request.method == 'PATCH')
        serializer = FactureDetailSerializer(facture, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        facture.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
def facture_enregistrer_paiement(request, pk):
    """
    Enregistre un paiement (total ou partiel) et met à jour le statut.
    Body attendu : { "montant_paye": 150.00 }
    """
    try:
        facture = Facture.objects.get(pk=pk)
    except Facture.DoesNotExist:
        return Response({'error': 'Facture introuvable'}, status=status.HTTP_404_NOT_FOUND)

    montant = request.data.get('montant_paye')
    if montant is None:
        return Response(
            {'error': 'Le champ "montant_paye" est obligatoire.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        montant = float(montant)
        if montant < 0:
            raise ValueError
    except (ValueError, TypeError):
        return Response(
            {'error': 'Le montant doit être un nombre positif.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    facture.montant_paye = montant
    facture.mettre_a_jour_statut_paiement()

    return Response(FactureDetailSerializer(facture).data)


# =============================================================================
# LIGNES FACTURE
# GET  /api/factures/factures/<facture_id>/lignes/   → liste
# POST /api/factures/factures/<facture_id>/lignes/   → ajouter
# GET/PUT/PATCH/DELETE /api/factures/lignes-factures/<id>/
# =============================================================================

@api_view(['GET', 'POST'])
def ligne_facture_list(request, facture_id):
    try:
        facture = Facture.objects.get(pk=facture_id)
    except Facture.DoesNotExist:
        return Response({'error': 'Facture introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        lignes = facture.lignes_facture.select_related('piece').all()
        return Response(LigneFactureSerializer(lignes, many=True).data)

    elif request.method == 'POST':
        serializer = LigneFactureCreateSerializer(data=request.data)
        if serializer.is_valid():
            ligne = serializer.save(facture=facture)
            return Response(LigneFactureSerializer(ligne).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
def ligne_facture_detail(request, pk):
    try:
        ligne = LigneFacture.objects.select_related('piece', 'facture').get(pk=pk)
    except LigneFacture.DoesNotExist:
        return Response({'error': 'Ligne introuvable'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(LigneFactureSerializer(ligne).data)

    elif request.method in ['PUT', 'PATCH']:
        partial = (request.method == 'PATCH')
        serializer = LigneFactureCreateSerializer(ligne, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(LigneFactureSerializer(ligne).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        ligne.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
