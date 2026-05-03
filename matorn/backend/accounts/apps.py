from django.apps import AppConfig


class AccountsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "accounts"

    def ready(self):
        # Important ! Sans ça, les signals ne sont pas chargés au démarrage
        import accounts.models  # noqa