#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'damxscorp.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Impossible d'importer Django !\n"
            "T'as activé ton environnement virtuel FDP 😂!?\n"
            "Vérifie que tu l'as bien activé et réessaie.😉\n"
            "Si ça marche toujours pas, vérifie que Django est bien installé dans ton environnement virtuel.😎"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()