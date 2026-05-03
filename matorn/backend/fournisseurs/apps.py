from django.apps import AppConfig


class FournisseursConfig(AppConfig):
    """
    Configuration de l'app fournisseurs.
    Gère tout ce qui concerne les commandes fournisseurs.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'fournisseurs'
    verbose_name = 'Gestion des Fournisseurs'