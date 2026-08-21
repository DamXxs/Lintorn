# CLAUDE.md — Lintorn

> Les règles à respecter pour travailler **sur Lintorn lui-même**.
> Ce que fait l'outil et comment on s'en sert → `README.md`.
> Ce qui appartient à un projet audité → sa propre config, jamais ce dépôt.
>
> 🧹 **Entretien** : ne jamais écrire ici « ✅ fait le … ». Test avant d'ajouter
> ou de garder une ligne : *« si je l'efface, quelqu'un peut-il refaire
> l'erreur ? »* — **oui** → c'est une règle, elle reste ; **non** → git s'en
> charge. Un doc faux coûte plus cher qu'un doc absent.

---

## Le principe fondateur

> **Un contrôle qui devient muet est plus dangereux qu'un contrôle rouge.**

Un rouge se corrige. Un contrôle qui cesse silencieusement de vérifier laisse
croire qu'on est couvert alors que plus rien n'est surveillé. Chaque fois qu'un
choix se présente, c'est ce principe qui tranche.

En pratique, cela interdit quatre choses :

| Interdit | À la place |
|---|---|
| Afficher `OK` quand un outil est absent | `INDISPONIBLE`, avec la commande pour l'installer |
| Afficher `OK` sur zéro élément vérifié | dire qu'il n'y avait rien à vérifier |
| Deviner une valeur qu'on n'a pas | rendre `None` et laisser l'appelant décider |
| Garder une règle dont le dossier n'existe pas | l'écarter, elle scannerait le vide |

---

## Règles

| Sujet | Règle critique |
|---|---|
| **Aucun nom de projet en dur** | Ni `matorn`, ni un chemin de machine, ni un nom d'utilisateur. Une règle maison de Lintorn le vérifie à chaque exécution — voir `[[regles]]` dans `.lintorn/regles.toml` |
| **Zéro dépendance** | `dependencies = []` dans `pyproject.toml`, et ça n'est pas négociable : Lintorn doit tourner dans un hook git avec n'importe quel python du système. Stdlib uniquement |
| Les chemins | Tout part du **projet audité** (`RACINE`, déduite du dossier courant), jamais de `__file__`. Installé par pip, `__file__` pointe dans `site-packages` : la déduction viserait le venv et tous les contrôles s'effondreraient en paraissant sains |
| Les outils externes | Lancés avec le python **du projet** (`config.PYTHON`), jamais celui de Lintorn — sinon ruff applique ses propres règles et pytest ne voit aucune dépendance du projet |
| Ce qui appartient au projet | Règles maison, contrôles actifs, commandes : dans **sa** config, jamais livrés dans le paquet. Une règle maison décrit une maison |
| Défauts non invasifs | Rien qui exécute le code du projet, sorte sur le réseau ou ouvre une base **sans accord explicite** (`opt_in`). Le premier lancement doit être incapable de faire du dégât |
| Préfixes de chemins | Déduits de la détection (`PREFIXE_BACKEND`, `PREFIXES_PROJET`), jamais écrits. Codés en dur, le focus du hook ne reconnaît plus aucun fichier et annonce « rien de cassé » sans avoir comparé |
| Hooks git | Le bit exécutable est **vérifié**, pas supposé : git ignore un hook non exécutable sans le moindre message. `copyfile` ne transporte pas les permissions, `installer_hook()` les repose |
| Code de sortie | `python -m outil` sur un module absent sort en `1`, indiscernable d'une vraie alerte. `noyau.lancer()` reconnaît « No module named » et bascule en `INDISPONIBLE` |
| Sorties de l'outil | Tout ce que Lintorn écrit va dans `.lintorn/` du projet audité. Rien à la racine : un rapport posé là est ramassé par le scan de documentation, et Lintorn analyse son propre rapport |
| Langue | Le code, les commentaires et les messages sont en **français**. Le `README.md` et la description PyPI sont en **anglais** — c'est la vitrine |
| Commentaires | Garder le **pourquoi**, retirer l'anecdote. « git ignore un hook non exécutable en silence » reste ; « le dev s'est fait piéger le 12/08 » part |
| Doc | **Jamais de numéro de ligne** dans un commentaire ou un document : il périme à la première édition, et aucun contrôle ne le détecte. Citer les noms de fonctions ou de sections |
| Versions | Un numéro publié sur PyPI est **définitif**. Corriger, c'est publier la version suivante. `__version__` dans `src/lintorn/__init__.py` et `version` dans `pyproject.toml` doivent rester d'accord |

---

## Structure

```
src/lintorn/
├── config.py        les chemins détectés, les commandes, la config du projet audité
├── cli.py           le point d'entrée, l'aiguillage des options, le rapport
├── base.py          la fiche Resultat, le lanceur d'outils, les traductions
├── controles_projet.py     ce qui juge LE PROJET : doc, mémoire IA, règles
├── controles_outillage.py  ce qui juge LINTORN : son hook, sa fraîcheur
├── noyau.py         l'orchestration : qui tourne, dans quel ordre
├── traductions.py   les codes d'outils traduits en français
├── dependances.py   requirements.txt vs venv — lancé comme un script séparé
└── hooks/pre-push   le hook installé dans le projet audité
tests/test_lintorn.py
```

`config.py` décide de tout : c'est par lui qu'on commence pour comprendre le reste.

---

## Développer

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -e .          # `-e` : ton code local, pas une copie figée
pip install ruff pytest

pytest -q                 # les tests
ruff check .              # le lint (config dans pyproject.toml)
lintorn --rapide          # Lintorn s'audite lui-même
```

**`pip install -e .`, jamais `pip install lintorn`** dans ce dépôt : la seconde
installerait la version publiée, et tes modifications seraient ignorées.

Les tests doivent passer **dans les deux mondes** : sur ce dépôt (pas de Django)
et sur un projet Django. Ceux qui exigent vraiment un projet complet se skippent
proprement plutôt que d'échouer.

---

## Licence

**AGPL-3.0**, copyright Olotorn. Le dual licensing (donc la licence commerciale)
n'est possible que tant qu'un seul détenteur possède tout le copyright :
**aucune contribution externe ne peut être fusionnée sans CLA signé.**
