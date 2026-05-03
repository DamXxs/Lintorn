# /backend/accounts/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # POST /api/auth/login/    → connexion → retourne les cookies JWT
    path('login/',   views.login_view,   name='auth_login'),
    
    # POST /api/auth/logout/   → déconnexion → efface les cookies
    path('logout/',  views.logout_view,  name='auth_logout'),
    
    # POST /api/auth/refresh/  → renouvelle l'access token depuis le refresh token
    path('refresh/', views.refresh_view, name='auth_refresh'),
    
    # GET  /api/auth/me/       → retourne l'utilisateur connecté + son rôle
    path('me/',      views.me_view,      name='auth_me'),

    # Routes protégées (Admin+)
    path('users/',          views.users_list,   name='users_list'),
    path('users/<int:pk>/', views.user_detail,  name='user_detail'),
]