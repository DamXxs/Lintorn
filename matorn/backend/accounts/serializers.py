# /backend/accounts/serializers.py
from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile, Role


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = UserProfile
        fields = ['role']


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer complet pour afficher un utilisateur + son rôle.
    """
    role = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'is_active', 'date_joined', 'role']
        read_only_fields = ['id', 'date_joined']

    def get_role(self, obj):
        try:
            return obj.profile.role
        except UserProfile.DoesNotExist:
            return Role.USER


class UserCreateSerializer(serializers.Serializer):
    """
    Serializer pour créer un nouvel utilisateur.
    """
    username = serializers.CharField(max_length=150)
    password = serializers.CharField(min_length=6, write_only=True)
    email    = serializers.EmailField(required=False, allow_blank=True)
    role     = serializers.ChoiceField(choices=Role.choices, default=Role.USER)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Ce nom d'utilisateur existe déjà.")
        return value


class UserUpdateSerializer(serializers.Serializer):
    """
    Serializer pour modifier un utilisateur existant.
    """
    email     = serializers.EmailField(required=False, allow_blank=True)
    role      = serializers.ChoiceField(choices=Role.choices, required=False)
    is_active = serializers.BooleanField(required=False)
    password  = serializers.CharField(min_length=6, required=False, write_only=True)