# /backend/accounts/management/commands/set_role.py

"""
🔧 COMMANDE DJANGO UNIVERSELLE — set_role

Gère les rôles de tous les utilisateurs depuis le terminal.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UTILISATION :

  Changer le rôle d'un utilisateur :
    python manage.py set_role <username> <role>

  Lister tous les utilisateurs et leurs rôles :
    python manage.py set_role --list

RÔLES DISPONIBLES :
  user        → Accès de base (lecture)
  superuser   → Accès étendu (lecture + écriture)
  admin       → Gestion des utilisateurs
  superadmin  → Accès total (maintenance, dashboard Django)

EXEMPLES :
  python manage.py set_role damien superadmin
  python manage.py set_role jean user
  python manage.py set_role marie admin
  python manage.py set_role --list
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from accounts.models import Role  # adapte si ton modèle est ailleurs


# Correspondance nom saisi en ligne de commande → valeur du modèle Role
# Permet d'accepter "superadmin", "SUPERADMIN", "SuperAdmin" indifféremment
ROLE_MAP = {
    'user':       Role.USER,
    'superuser':  Role.SUPERUSER,
    'admin':      Role.ADMIN,
    'superadmin': Role.SUPERADMIN,
}

# Emoji par rôle pour l'affichage dans le terminal
ROLE_EMOJI = {
    Role.USER:       '👤',
    Role.SUPERUSER:  '🔑',
    Role.ADMIN:      '🛡️',
    Role.SUPERADMIN: '👑',
}


class Command(BaseCommand):

    help = "Gère les rôles utilisateurs (user / superuser / admin / superadmin)"

    def add_arguments(self, parser):
        """
        Deux modes :
          - Mode normal  : set_role <username> <role>
          - Mode listing : set_role --list
        """
        # username et role sont optionnels car --list n'en a pas besoin
        parser.add_argument(
            'username',
            type=str,
            nargs='?',         # nargs='?' = argument optionnel
            help="Nom d'utilisateur cible",
        )
        parser.add_argument(
            'role',
            type=str,
            nargs='?',
            help=f"Rôle à attribuer : {', '.join(ROLE_MAP.keys())}",
        )
        parser.add_argument(
            '--list',
            action='store_true',   # --list est un flag (vrai/faux), pas une valeur
            help="Liste tous les utilisateurs et leurs rôles",
        )

    def handle(self, *args, **options):
        """
        Point d'entrée de la commande.
        Redirige vers le bon mode selon les arguments fournis.
        """

        # ── Mode listing ───────────────────────────────────────
        if options['list']:
            self._afficher_liste()
            return

        # ── Mode changement de rôle ────────────────────────────
        username = options['username']
        role_str = options['role']

        # Vérification que les deux arguments sont bien fournis
        if not username or not role_str:
            raise CommandError(
                "❌ Usage : python manage.py set_role <username> <role>\n"
                f"   Rôles disponibles : {', '.join(ROLE_MAP.keys())}\n"
                "   Pour lister : python manage.py set_role --list"
            )

        self._changer_role(username, role_str)

    # ════════════════════════════════════════════════════════════
    # MÉTHODES PRIVÉES
    # ════════════════════════════════════════════════════════════

    def _changer_role(self, username: str, role_str: str) -> None:
        """Change le rôle d'un utilisateur."""

        # ── Validation du rôle saisi ───────────────────────────
        # On met en minuscules pour accepter toutes les casses
        role_str_lower = role_str.lower()
        if role_str_lower not in ROLE_MAP:
            raise CommandError(
                f"❌ Rôle '{role_str}' inconnu.\n"
                f"   Rôles disponibles : {', '.join(ROLE_MAP.keys())}"
            )

        role_cible = ROLE_MAP[role_str_lower]

        # ── Récupération de l'utilisateur ──────────────────────
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise CommandError(f"❌ Utilisateur '{username}' introuvable.")

        # ── Récupération du profil ─────────────────────────────
        profile     = user.profile
        role_actuel = profile.role
        emoji_cible = ROLE_EMOJI.get(role_cible, '❓')

        # ── Déjà ce rôle ? ─────────────────────────────────────
        if role_actuel == role_cible:
            self.stdout.write(
                self.style.WARNING(
                    f"⚠️  '{username}' a déjà le rôle {role_str.upper()}. Rien n'a changé."
                )
            )
            return

        # ── Changement effectif ────────────────────────────────
        self.stdout.write(f"\n👤 Utilisateur  : {username}")
        self.stdout.write(f"🔄 Rôle actuel  : {role_actuel}")

        profile.role = role_cible
        profile.save()

        self.stdout.write(f"{emoji_cible} Nouveau rôle  : {profile.role}")
        self.stdout.write(
            self.style.SUCCESS(
                f"\n✅ '{username}' est maintenant {role_str.upper()} !\n"
            )
        )

    def _afficher_liste(self) -> None:
        """Affiche tous les utilisateurs avec leur rôle."""

        users = User.objects.select_related('profile').all().order_by('username')

        if not users.exists():
            self.stdout.write(self.style.WARNING("⚠️  Aucun utilisateur trouvé."))
            return

        self.stdout.write("\n👥 Utilisateurs et leurs rôles :")
        self.stdout.write("─" * 40)

        for user in users:
            role       = user.profile.role
            emoji      = ROLE_EMOJI.get(role, '❓')
            # Aligne proprement les colonnes avec ljust (padding à droite)
            username   = user.username.ljust(20)
            self.stdout.write(f"   {username} {emoji}  {role}")

        self.stdout.write("─" * 40)
        self.stdout.write(f"   Total : {users.count()} utilisateur(s)\n")