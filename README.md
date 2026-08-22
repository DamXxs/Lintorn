# Lintorn

**Audits your code and the memory your AI assistant reads — and tells you when the two drift apart.**

Coding assistants read your project documentation: CLAUDE.md, architecture notes, persistent
memory files. That documentation is written once and then quietly rots. The assistant keeps
reading it, keeps trusting it, and keeps acting on rules that no longer match the code.

Lintorn checks both sides. It runs the usual quality tools over your codebase, and it verifies
that every path, rule and claim in your AI-facing documentation still corresponds to something
real. When they disagree, it says so.

```console
$ pip install lintorn
$ cd your-project
$ lintorn --init
$ lintorn

=== Lintorn - RAPPORT AUDIT ===
[ OK ] Ruff (lint Python)          rien a signaler
[ OK ] TypeScript (tsc --noEmit)   rien a signaler
[ !! ] Doc vs code                 124 chemin(s) cite(s), 12 introuvable(s)
[ ?? ] Memoire IA vs code          46 chemin(s) cite(s), 3 a verifier
[ ?? ] Regles enoncees vs controlees  25 enoncee(s), 1 controlee(s), 24 SANS controle
[ OK ] Hook pre-push               branche et executable
```

## The idea it is built around

> **A check that goes quiet is more dangerous than a check that goes red.**

A red check gets fixed. A check that silently stops working leaves you feeling covered while
nothing is being watched. Lintorn treats that as the primary failure mode, everywhere:

- A tool that is **not installed** reports as unavailable — never as "0 problems found".
- A rule whose target directory does not exist is **dropped**, not reported as passing.
- Declaring **no** rules says so, instead of "all rules are met".
- Its own git hook is checked for the **executable bit** — git ignores a non-executable hook
  in complete silence, which is exactly how this project lost its guard for four days.

## What it checks

| Area | Checks |
|---|---|
| **Docs vs code** | every path cited in your documentation still exists |
| **AI memory vs code** | same treatment for your assistant's persistent memory |
| **Memory freshness** | memory citing code that changed since it was last verified |
| **House rules** | your own conventions, enforced mechanically |
| **Stated vs enforced** | rules written in `CLAUDE.md` that no check actually enforces |
| **Python** | ruff, missing migrations, `manage.py check`, pytest, pip-audit, vulture |
| **JavaScript** | `tsc --noEmit` |
| **Tooling itself** | whether its own pre-push hook is installed *and* executable |

Everything is auto-detected. No Django? The Django checks do not appear at all — rather than
sitting there permanently "unavailable", which is how a warning light becomes furniture.

## Rules you state, rules you enforce

Your `CLAUDE.md` tells an assistant what this project's rules are. Nothing links those
sentences to anything that enforces them, so the gap between what a project *declares* and what
it *verifies* widens quietly: nobody re-reads documentation looking for what is missing
somewhere else.

Lintorn reads the rules out of your AI instruction file and reports the ones no check covers.
It never invents the detection. *"Never hardcode a colour"* does not say whether to match
`#fff`, `rgba(` or `hsl()`, nor whether comments are exempt. That is a technical decision, and
a guessed pattern is a false-positive factory — which is how a report stops being read.

So it drafts, and you decide. One commented block per uncovered rule, everything filled in
except the pattern:

```toml
# [[regles]]
# source   = "CLAUDE.md:23"   # the rule is STATED there, not here
# nom      = "Shared axios"
# racine   = "."
# suffixes = [".ts", ".tsx"]
# motif    = ''               # <- yours to write: what a VIOLATION looks like
# bloquant = false
```

`source` replaces copying the sentence into the config, so the rule stays stated in exactly one
place and cannot drift. This check never blocks a push: documenting an intention should not be
punished.

## Documents that legitimately cite what does not exist

A roadmap, a design note or a post-mortem cites files that do not exist — not yet
(a module still to write), or no longer (a file deleted, mentioned precisely because
it was). Blocking on those would push you to write such documents *outside* the
scanned folders, which recreates the blind spot the check exists to remove.

Mark the document, anywhere in it:

```markdown
<!-- lintorn:prospectif -->
```

Its dead paths are then **listed, not failed** — you still see them, they just stop
blocking your push.

### Two genres are recognised without any marker

**Tutorials.** A tutorial teaches the reader to create files *in their own project*,
so it legitimately cites paths that do not exist here. The signal is unambiguous, and
it was measured on FastAPI's 1693 documents: the distribution is bimodal — 146
documents have **no** missing path, 207 have **all** of them missing. Hence the rule,
stated in one sentence: *if most of what a document cites does not exist here, it is
not describing this project*. A single citation is never excused — that is exactly the
shape of real documentation rot.

**Version logs.** A changelog cites what existed *at the time*. Recognised by name:

```
CHANGELOG.md    release-notes.md    HISTORY.md    NEWS.md
```

On FastAPI, one such file alone accounted for 174 of the 460 blocking paths.

Without this, FastAPI reported **460 blocking paths on first run** — a wall that makes
you close the tool. With the only escape hatch that existed (`docs_exclus = ["docs/*"]`),
98% of the documentation stopped being read at all, for a green light on 2 paths: the
false all-clear this tool exists to prevent. Both numbers now appear in the summary line,
requalified documents included — silence is never an option.

## What this check is *not* for

The documentation check targets **descriptive** documentation — "the services/api.ts
module does this". Two families fall outside it by nature:

- **tutorials**: "create a file called myapp.py" cites a file *the reader* will create;
- **changelogs**: they cite files from every past version, including deleted ones.

Pointed at a large reference project, Lintorn flagged 460 dead paths — every one of them
from its tutorials and release notes. At that noise level nobody reads the check, so it
protects nothing. Exclude them:

```toml
docs_exclus = ["docs/*", "CHANGELOG.md"]
```

## Safe by default

The first run cannot damage anything. Lintorn does not modify your files, does not reach the
network, and does not execute your project's code unless you ask.

These are **opt-in**: `tests` (runs your code), `failles` (network), `donnees_metier` (opens
your database), `code_mort` and `deploy` (noisy during development).

## Configuration

`lintorn --init` writes two files, because they do not have the same life:

| File | What it holds | How it behaves |
|---|---|---|
| `.lintorn/config.toml` | settings — which checks run, which files count as AI instructions | written once, rarely touched |
| `.lintorn/regles.toml` | your house rules | grows, edited often, reviewed by the team |

Settings may also live under `[tool.lintorn]` in your `pyproject.toml`. The standalone file
matters for projects with no `pyproject.toml` at their root, which is most non-Python ones.
Rules declared in either place still work — the two sources are merged, so nothing breaks for
projects configured before `regles.toml` existed.

```toml
[controles]
tests = true

[[regles]]
nom      = "Hard-coded colours in CSS"
regle    = "theme variables only — var(--bg)"
racine   = "front/src"
suffixes = [".css"]
motif    = '#[0-9a-fA-F]{3,8}\b'
bloquant = false          # true = block the regression, false = measure the debt

[[commandes]]
cle   = "mypy"
titre = "Types (mypy)"
cmd   = ["python", "-m", "mypy", "."]
```

Custom commands are **executed** — the same contract as npm scripts, git hooks or a Makefile.
Do not run Lintorn inside a repository you do not trust.

## Other languages

Lintorn is *written* in Python; it does not require your project to be. The four checks that
make it unusual — docs vs code, AI memory, house rules, hook integrity — are language-agnostic
and work on any repository. Anything else plugs in through `[[commandes]]`: phpstan, eslint,
`go vet`, `cargo clippy`.

## The external tools

Lintorn itself has **zero dependencies** — deliberately, so it can run inside a git hook with
any Python on the machine. The tools it calls belong to the project being audited, so that ruff
applies *your* rules and pytest sees *your* dependencies.

```console
$ lintorn --installer-outils     # ruff, pytest, vulture, pip-audit — asks first
```

TypeScript needs nothing extra: `npm install` already provides `tsc`.

### Which Python runs them

Lintorn looks for your project's virtualenv in `venv/`, `.venv/` and `env/` — at the repository
root and in its Python directory — and uses the interpreter it finds there.

When it finds none, it falls back to its own interpreter and **says so**, because the fallback
is not harmless: `pip-audit` would then report vulnerabilities of that environment rather than
your project's, and `requirements.txt` would be compared against the wrong site-packages. Both
still answer — plausibly, about the wrong environment. That is the one failure mode Lintorn
exists to remove, so it reports it as `Python du projet (venv)` instead of staying quiet.

If your virtualenv lives outside the project — poetry, pdm, conda — no naming convention can
find it. Point at it:

```toml
[tool.lintorn]
venv = "../.venvs/my-project"
```

This matters most when Lintorn is installed system-wide rather than per project. `pip` cannot
warn you at install time: a wheel is unpacked, never executed, so there is no install hook to
run and no way to ask a question. Prefer `pipx install lintorn`, and let the check above tell
you which interpreter actually did the auditing.

## Commands

```console
lintorn                      full audit
lintorn --rapide             skip the slow tools (what the pre-push hook runs)
lintorn --init               generate the config for this project
lintorn --esquisser-regles   draft a [[regles]] block per uncovered rule
lintorn --installer-hook     install the pre-push hook
lintorn --installer-outils   install the external tools, after confirmation
lintorn --doc                documentation check only
lintorn --guide              the one-page manual: what it is for, how to read a report
lintorn --maj-securite       what pip-audit suggests (dry run)
```

Requires Python 3.11+.

## Status

Working, and used daily. Lintorn audits itself — the fastest way to find out that a check had
quietly stopped meaning anything.

## License

[AGPL-3.0](LICENSE). Use, modify and share it freely. If you distribute it — or offer it as a
network service — you must release your source under the same license.

Copyright holder: **Olotorn**. For a commercial license exempting you from the source-disclosure
requirement, get in touch.

## Contributing

Not open to outside code contributions yet — bug reports and ideas are welcome. When it opens,
contributions will require a CLA, so that dual licensing remains possible. Details in
`CONTRIBUTING.md`.
