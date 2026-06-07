"""
Managers personnalisés pour gérer le soft-delete et l'archivage.

Un Manager Django, c'est l'objet qui s'occupe des requêtes en BDD.
Quand tu fais Client.objects.all(), "objects" est un Manager.

Ici on crée 4 Managers pour avoir 4 "vues" différentes :
- objects          : éléments ACTIFS uniquement (par défaut)
- all_objects      : TOUS les éléments (actifs + corbeille + archives)
- deleted_objects  : éléments en CORBEILLE uniquement
- archived_objects : éléments ARCHIVÉS uniquement
"""

from django.db import models


class ActiveManager(models.Manager):
    """
    Manager par défaut : ne retourne QUE les éléments actifs.
    Un élément actif = non supprimé ET non archivé.

    C'est ce qui rend la magie possible : tout le code existant
    utilise Client.objects.all() et n'aura RIEN à modifier.
    """

    def get_queryset(self):
        return super().get_queryset().filter(
            is_deleted=False,
            is_archived=False
        )


class AllObjectsManager(models.Manager):
    """
    Manager qui retourne TOUS les éléments, sans aucun filtre.
    Utile pour les admins ou pour les requêtes spéciales.
    """

    def get_queryset(self):
        return super().get_queryset()


class DeletedManager(models.Manager):
    """
    Manager qui retourne UNIQUEMENT les éléments en corbeille.
    Utilisé par la vue Archives pour afficher la corbeille.
    """

    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=True)


class ArchivedManager(models.Manager):
    """
    Manager qui retourne UNIQUEMENT les éléments archivés.
    Utilisé par la vue Archives pour afficher les archives.
    """

    def get_queryset(self):
        return super().get_queryset().filter(is_archived=True)
