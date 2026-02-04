from django.apps import AppConfig


class PlanningConfig(AppConfig):
    """
    Configuration de l'app planning.
    Gère tout ce qui concerne les rendez-vous et interventions.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'planning'
    verbose_name = 'Gestion du Planning'