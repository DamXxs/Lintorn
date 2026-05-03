# /backend/accounts/views.py
from django.contrib.auth import authenticate
from django.middleware.csrf import get_token
from .permissions import login_required_cookie

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from .models import UserProfile, Role


# =============================================================================
# HELPER : génère les 2 tokens pour un utilisateur
# =============================================================================
def _get_tokens_for_user(user):
    """
    Génère un access token et un refresh token pour un utilisateur Django.
    RefreshToken.for_user() est une méthode de simplejwt qui fait tout le boulot.
    """
    refresh = RefreshToken.for_user(user)
    
    # On ajoute le rôle directement dans le payload du token
    # Comme ça React pourra le lire sans faire une requête supplémentaire
    try:
        profile = user.profile
        refresh['role'] = profile.role
        refresh['username'] = user.username
    except UserProfile.DoesNotExist:
        refresh['role'] = Role.USER
        refresh['username'] = user.username
    
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


# =============================================================================
# HELPER : pose les cookies JWT sur la réponse
# =============================================================================
def _set_jwt_cookies(response, tokens):
    """
    Pose les 2 cookies httpOnly sur la réponse HTTP.
    
    httpOnly = True  → JavaScript NE PEUT PAS lire ce cookie (sécurité XSS)
    secure   = False → False en HTTP local (mettre True en HTTPS prod)
    samesite = 'Lax' → protection CSRF de base
    """
    # Access token : courte durée (15 min)
    response.set_cookie(
        key='access_token',
        value=tokens['access'],
        max_age=15 * 60,        # 15 minutes en secondes
        httponly=True,
        secure=False,           # ← True en production HTTPS
        samesite='Lax',
    )
    # Refresh token : longue durée (7 jours)
    response.set_cookie(
        key='refresh_token',
        value=tokens['refresh'],
        max_age=7 * 24 * 60 * 60,  # 7 jours en secondes
        httponly=True,
        secure=False,
        samesite='Lax',
    )


# =============================================================================
# LOGIN
# POST /api/auth/login/
# Body : { "username": "damien", "password": "motdepasse" }
# =============================================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Authentifie l'utilisateur et pose les cookies JWT.
    """
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '').strip()

    if not username or not password:
        return Response(
            {'error': 'Username et password obligatoires'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # authenticate() vérifie username + password dans la BDD Django
    user = authenticate(request, username=username, password=password)

    if user is None:
        return Response(
            {'error': 'Identifiants incorrects'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.is_active:
        return Response(
            {'error': 'Compte désactivé'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Génère les tokens
    tokens = _get_tokens_for_user(user)

    # Construit la réponse avec les infos utilisateur
    try:
        profile = user.profile
        role = profile.role
    except UserProfile.DoesNotExist:
        role = Role.USER

    response = Response({
        'message': 'Connexion réussie',
        'user': {
            'id':       user.id,
            'username': user.username,
            'email':    user.email,
            'role':     role,
        }
    })

    # Pose les cookies sur la réponse
    _set_jwt_cookies(response, tokens)

    return response


# =============================================================================
# LOGOUT
# POST /api/auth/logout/
# =============================================================================
@api_view(['POST'])
@login_required_cookie
def logout_view(request):
    """
    Déconnecte l'utilisateur en effaçant les cookies JWT.
    On essaie aussi de blacklister le refresh token si possible.
    """
    response = Response({'message': 'Déconnexion réussie'})

    # Efface les 2 cookies
    response.delete_cookie('access_token')
    response.delete_cookie('refresh_token')

    return response


# =============================================================================
# REFRESH
# POST /api/auth/refresh/
# Renouvelle l'access token depuis le refresh token (cookie)
# =============================================================================
@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_view(request):
    """
    Renouvelle l'access token en lisant le refresh token depuis le cookie.
    React appellera cet endpoint automatiquement quand l'access token expire.
    """
    # On lit le refresh token depuis le cookie (pas le body)
    refresh_token = request.COOKIES.get('refresh_token')

    if not refresh_token:
        return Response(
            {'error': 'Refresh token manquant'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    try:
        # Vérifie et décode le refresh token
        refresh = RefreshToken(refresh_token)
        
        # Génère un nouvel access token
        new_access_token = str(refresh.access_token)

        response = Response({'message': 'Token renouvelé'})
        
        # Pose le nouveau cookie access_token
        response.set_cookie(
            key='access_token',
            value=new_access_token,
            max_age=15 * 60,
            httponly=True,
            secure=False,
            samesite='Lax',
        )
        return response

    except (TokenError, InvalidToken):
        # Refresh token invalide ou expiré → forcer reconnexion
        response = Response(
            {'error': 'Session expirée, veuillez vous reconnecter'},
            status=status.HTTP_401_UNAUTHORIZED
        )
        response.delete_cookie('access_token')
        response.delete_cookie('refresh_token')
        return response


# =============================================================================
# ME — utilisateur connecté
# GET /api/auth/me/
# =============================================================================
@api_view(['GET'])
@login_required_cookie
def me_view(request):
    """
    Retourne les infos de l'utilisateur connecté.
    request.user et request.profile sont injectés par le décorateur.
    """

    # Plus besoin de lire le cookie manuellement — le décorateur l'a déjà fait !
    return Response({
        'id':       request.user.id,
        'username': request.user.username,
        'email':    request.user.email,
        'role':     request.profile.role,
    })
