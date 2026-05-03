# /backend/accounts/permissions.py
"""
Système de permissions custom pour Matorn.

3 décorateurs disponibles :
- @login_required_cookie   → vérifie juste qu'on est connecté
- @require_role('superuser') → vérifie un rôle minimum
- @require_superadmin      → réservé au SuperAdmin uniquement

Hiérarchie des rôles :
  user < superuser < admin < superadmin
"""

from functools import wraps

from rest_framework.response import Response
from rest_framework import status

from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken

from django.contrib.auth.models import User
from .models import UserProfile, Role


# =============================================================================
# ORDRE DE LA HIÉRARCHIE DES RÔLES
# Plus l'index est élevé, plus le rôle a de droits
# =============================================================================
ROLE_HIERARCHY = {
    Role.USER:       0,
    Role.SUPERUSER:  1,
    Role.ADMIN:      2,
    Role.SUPERADMIN: 3,
}


# =============================================================================
# HELPER : extrait et vérifie l'utilisateur depuis le cookie JWT
# =============================================================================
def _get_user_from_cookie(request):
    """
    Lit le cookie access_token, le décode, et retourne l'utilisateur Django.
    
    Retourne : (user, profile, error_response)
    - Si tout va bien : (user, profile, None)
    - Si erreur       : (None, None, Response d'erreur)
    """
    # Lecture du cookie
    access_token = request.COOKIES.get('access_token')
    
    if not access_token:
        return None, None, Response(
            {'error': 'Non authentifié — cookie access_token manquant'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    try:
        # Décodage du token JWT
        token = AccessToken(access_token)
        user_id = token['user_id']
        
        # Récupération de l'utilisateur en BDD
        user = User.objects.get(id=user_id)
        
        if not user.is_active:
            return None, None, Response(
                {'error': 'Compte désactivé'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Récupération du profil (et donc du rôle)
        try:
            profile = user.profile
        except UserProfile.DoesNotExist:
            # Sécurité : si pas de profil, on en crée un avec le rôle minimal
            profile = UserProfile.objects.create(user=user, role=Role.USER)
        
        return user, profile, None
    
    except (TokenError, InvalidToken):
        return None, None, Response(
            {'error': 'Token invalide ou expiré — veuillez vous reconnecter'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except User.DoesNotExist:
        return None, None, Response(
            {'error': 'Utilisateur introuvable'},
            status=status.HTTP_401_UNAUTHORIZED
        )


# =============================================================================
# DÉCORATEUR 1 : login_required_cookie
# Vérifie juste qu'on est connecté (peu importe le rôle)
# =============================================================================
def login_required_cookie(view_func):
    """
    Vérifie que l'utilisateur est connecté via le cookie JWT.
    Injecte request.user et request.profile dans la vue.
    
    Usage :
        @api_view(['GET'])
        @login_required_cookie
        def ma_vue(request):
            print(request.user.username)  # disponible !
            print(request.profile.role)   # disponible !
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user, profile, error = _get_user_from_cookie(request)
        
        if error:
            return error
        
        # On injecte l'user et le profil dans la requête
        # pour que la vue puisse y accéder facilement
        request.user = user
        request.profile = profile
        
        return view_func(request, *args, **kwargs)
    
    return wrapper


# =============================================================================
# DÉCORATEUR 2 : require_role
# Vérifie que l'utilisateur a AU MOINS le rôle demandé
# =============================================================================
def require_role(minimum_role):
    """
    Vérifie que l'utilisateur a un rôle >= au rôle minimum demandé.
    
    La hiérarchie : user < superuser < admin < superadmin
    Donc require_role('superuser') autorise : superuser, admin, superadmin
    
    Usage :
        @api_view(['DELETE'])
        @require_role('superuser')
        def supprimer_client(request, pk):
            ...
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            user, profile, error = _get_user_from_cookie(request)
            
            if error:
                return error
            
            # Vérification de la hiérarchie des rôles
            niveau_utilisateur = ROLE_HIERARCHY.get(profile.role, 0)
            niveau_requis      = ROLE_HIERARCHY.get(minimum_role, 0)
            
            if niveau_utilisateur < niveau_requis:
                return Response(
                    {
                        'error': f"Accès refusé — rôle '{minimum_role}' minimum requis",
                        'votre_role': profile.role,
                    },
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Injection dans la requête
            request.user    = user
            request.profile = profile
            
            return view_func(request, *args, **kwargs)
        
        return wrapper
    return decorator


# =============================================================================
# DÉCORATEUR 3 : require_superadmin
# Raccourci pour les actions réservées au SuperAdmin
# =============================================================================
def require_superadmin(view_func):
    """
    Raccourci pour @require_role('superadmin').
    Réservé à toi — accès multi-garages, config globale, etc.
    
    Usage :
        @api_view(['GET'])
        @require_superadmin
        def liste_tous_garages(request):
            ...
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user, profile, error = _get_user_from_cookie(request)
        
        if error:
            return error
        
        if profile.role != Role.SUPERADMIN:
            return Response(
                {'error': 'Accès réservé au Super Administrateur'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        request.user    = user
        request.profile = profile
        
        return view_func(request, *args, **kwargs)
    
    return wrapper