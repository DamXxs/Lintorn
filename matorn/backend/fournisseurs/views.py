# /backend/fournisseurs/views.py
from django.db import models as django_models
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .models import Fournisseur
from .serializers import FournisseurSerializer, EmailCommandeSerializer
from accounts.permissions import login_required_cookie


# =============================================================================
# LISTE + CRÉATION
# GET  /api/fournisseurs/   → tous les fournisseurs
# POST /api/fournisseurs/   → créer un fournisseur
# =============================================================================
@api_view(['GET', 'POST'])
@login_required_cookie
def fournisseur_list(request):

    if request.method == 'GET':
        fournisseurs = Fournisseur.objects.all()

        # Filtre actifs uniquement : /api/fournisseurs/?actif=true
        actif = request.query_params.get('actif', None)
        if actif == 'true':
            fournisseurs = fournisseurs.filter(actif=True)

        # Recherche par nom : /api/fournisseurs/?search=auto
        search = request.query_params.get('search', None)
        if search:
            fournisseurs = fournisseurs.filter(nom__icontains=search)

        serializer = FournisseurSerializer(fournisseurs, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = FournisseurSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# =============================================================================
# DÉTAIL + MODIFICATION + SUPPRESSION
# GET    /api/fournisseurs/42/
# PUT    /api/fournisseurs/42/
# PATCH  /api/fournisseurs/42/
# DELETE /api/fournisseurs/42/
# =============================================================================
@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@login_required_cookie
def fournisseur_detail(request, pk):

    try:
        fournisseur = Fournisseur.objects.get(pk=pk)
    except Fournisseur.DoesNotExist:
        return Response(
            {'error': 'Fournisseur introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    if request.method == 'GET':
        serializer = FournisseurSerializer(fournisseur)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = FournisseurSerializer(fournisseur, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'PATCH':
        # Pratique pour juste toggle actif/inactif sans envoyer tout l'objet
        serializer = FournisseurSerializer(fournisseur, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        # Sécurité : on refuse si des pièces sont encore liées
        if fournisseur.pieces.exists():
            return Response(
                {'error': f"Ce fournisseur a {fournisseur.pieces.count()} pièce(s) liée(s). "
                           "Réassignez-les avant de le supprimer."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        fournisseur.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# =============================================================================
# GÉNÉRATION D'EMAIL DE COMMANDE PRÉ-REMPLI
# GET /api/fournisseurs/42/email-commande/
#
# Logique :
#   1. On récupère le fournisseur
#   2. On cherche toutes les pièces liées dont le stock est sous le seuil minimum
#   3. On construit un objet "email" avec : sujet, corps, email destinataire
#   4. Le frontend React n'a plus qu'à afficher ça dans un formulaire
# =============================================================================
@api_view(['GET'])
@login_required_cookie
def generer_email_commande(request, pk):
    """
    Génère un email de commande pré-rempli pour un fournisseur.
    Seules les pièces dont stock_actuel < stock_minimum sont incluses.
    """

    try:
        fournisseur = Fournisseur.objects.get(pk=pk)
    except Fournisseur.DoesNotExist:
        return Response(
            {'error': 'Fournisseur introuvable'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Récupère les pièces en alerte liées à ce fournisseur
    # stock_actuel < stock_minimum → alerte ou rupture
    pieces_alerte = fournisseur.pieces.filter(
        stock_actuel__lt=django_models.F('stock_minimum')
    )

    if not pieces_alerte.exists():
        return Response(
            {'message': f"Aucune pièce en alerte pour {fournisseur.nom}. Rien à commander !"},
            status=status.HTTP_200_OK
        )

    # Construit la liste des pièces avec la quantité suggérée à commander
    pieces_data = []
    for piece in pieces_alerte:
        # Quantité suggérée = ce qu'il faut pour revenir au double du minimum
        # Exemple : minimum=5, stock=1 → on commande (5*2 - 1) = 9
        quantite_suggeree = max(1, (piece.stock_minimum * 2) - piece.stock_actuel)
        pieces_data.append({
            'id': piece.id,
            'reference': piece.reference,
            'nom': piece.nom,
            'stock_actuel': piece.stock_actuel,
            'stock_minimum': piece.stock_minimum,
            'quantite_suggeree': quantite_suggeree,
        })

    # Construction du corps de l'email
    salutation = f"Bonjour {fournisseur.contact_nom}," if fournisseur.contact_nom else "Bonjour,"

    lignes_pieces = "\n".join([
        f"  - [{p['reference']}] {p['nom']} "
        f"— Stock actuel : {p['stock_actuel']} / Minimum : {p['stock_minimum']} "
        f"→ Quantité demandée : {p['quantite_suggeree']}"
        for p in pieces_data
    ])

    corps = (
        f"{salutation}\n\n"
        f"Nous souhaitons passer commande pour les pièces suivantes dont notre stock est faible :\n\n"
        f"{lignes_pieces}\n\n"
        f"Merci de nous confirmer la disponibilité, les délais de livraison et le montant total.\n\n"
        f"Cordialement,\n"
        f"L'équipe du garage"
    )

    # On assemble la réponse complète
    email_data = {
        'fournisseur_id': fournisseur.id,
        'fournisseur_nom': fournisseur.nom,
        'email_destinataire': fournisseur.email,
        'contact_nom': fournisseur.contact_nom,
        'sujet': f"Commande de réapprovisionnement — {len(pieces_data)} pièce(s) en alerte",
        'corps': corps,
        'pieces': pieces_data,
    }

    serializer = EmailCommandeSerializer(email_data)
    return Response(serializer.data)


# =============================================================================
# LISTE DES FOURNISSEURS AVEC PIÈCES EN ALERTE
# GET /api/fournisseurs/alertes/
#
# Utile pour le dashboard React : affiche quels fournisseurs doivent être contactés
# =============================================================================
@api_view(['GET'])
@login_required_cookie
def fournisseurs_avec_alertes(request):
    """
    Retourne uniquement les fournisseurs qui ont au moins une pièce en alerte.
    Pratique pour le dashboard : "Ces fournisseurs nécessitent une commande"
    """

    # On récupère les IDs des fournisseurs qui ont des pièces en alerte
    fournisseurs = Fournisseur.objects.filter(
        actif=True,
        pieces__stock_actuel__lt=django_models.F('pieces__stock_minimum')
    ).distinct()

    # On ajoute le nb de pièces en alerte pour chaque fournisseur
    result = []
    for f in fournisseurs:
        nb_alertes = f.pieces.filter(
            stock_actuel__lt=django_models.F('stock_minimum')
        ).count()
        result.append({
            'id': f.id,
            'nom': f.nom,
            'email': f.email,
            'contact_nom': f.contact_nom,
            'nb_pieces_en_alerte': nb_alertes,
        })

    return Response(result)
