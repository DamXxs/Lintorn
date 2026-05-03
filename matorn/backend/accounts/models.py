from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class Role(models.TextChoices):
    USER       = "user",       "Utilisateur"
    SUPERUSER  = "superuser",  "Super Utilisateur"
    ADMIN      = "admin",      "Administrateur"
    SUPERADMIN = "superadmin", "Super Administrateur"


class UserProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.USER
    )

    # ⚠️ COMMENTÉ — sera décommenté quand on ajoutera le modèle Garage (multi-garages)
    # garage = models.ForeignKey(
    #     "referentiels.Garage",
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name="utilisateurs"
    # )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Profil utilisateur"
        verbose_name_plural = "Profils utilisateurs"

    def __str__(self):
        return f"{self.user.username} — {self.get_role_display()}"

    def is_superuser_role(self):
        return self.role in [Role.SUPERUSER, Role.ADMIN, Role.SUPERADMIN]

    def is_admin(self):
        return self.role in [Role.ADMIN, Role.SUPERADMIN]

    def is_superadmin(self):
        return self.role == Role.SUPERADMIN


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()