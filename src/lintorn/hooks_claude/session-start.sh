#!/bin/sh
#
# Hook SESSION-START (Claude Code) — le hook pre-push est-il branche ?
#
# LE PROBLEME QU'IL REGLE (et pourquoi Lintorn ne pouvait pas le regler seul)
#   `core.hooksPath` vit dans .git/config, un fichier NON versionne : sur un
#   clone frais (Codespaces, nouvelle machine) il est absent, et `git push` ne
#   controle alors plus rien — sans le moindre message.
#
#   Lintorn sait deja detecter ca (controle « Hook pre-push »). Mais ce controle
#   ne parle que quand Lintorn tourne... et Lintorn tourne automatiquement via le
#   hook pre-push. Serpent qui se mord la queue : tant que le hook manque,
#   personne ne signale qu'il manque.
#
#   Ce script casse la boucle par l'exterieur : il ne depend pas de Lintorn, et
#   il parle au demarrage de chaque session.
#
# CE QU'IL NE FAIT PAS
#   Il ne repare RIEN tout seul. Ecrire dans .git/config en silence au
#   demarrage d'une session serait une modification non demandee. Il signale,
#   et laisse decider.
#
# Ce qui sort sur la sortie standard est ajoute au contexte de Claude : c'est
# lui qui te relaiera l'alerte.

ATTENDU=".lintorn/hooks"

# check=false volontaire : `git config --get` sort en 1 quand la cle est
# absente, or c'est exactement le cas qu'on cherche a detecter.
ACTUEL=$(git config --get core.hooksPath 2>/dev/null)

if [ "$ACTUEL" = "$ATTENDU" ]; then
    exit 0
fi

echo "ALERTE OUTILLAGE — le hook pre-push de Lintorn n'est pas branche sur cette machine."
if [ -z "$ACTUEL" ]; then
    echo "  core.hooksPath : non defini (git regarde dans .git/hooks/, qui est vide)"
else
    echo "  core.hooksPath : '$ACTUEL' — attendu : '$ATTENDU'"
fi
echo "  Consequence : 'git push' ne lance aucun controle, silencieusement."
echo "  Reparation (a proposer au dev, une seule commande) :"
echo "      lintorn --installer-hook"

# Toujours 0 : un demarrage de session ne doit jamais echouer sur un
# avertissement d'outillage.
exit 0
