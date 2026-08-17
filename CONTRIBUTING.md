# Contributing to Lintorn

Thanks for your interest. Please read this before opening a pull request.

## Current status

**Lintorn is not yet open to outside code contributions.** The project is young and
its internals still move quickly. Pull requests will be politely declined for now.

What *is* welcome, and genuinely useful:

- **Bug reports** — especially a check that goes silently wrong. A check that reports
  `OK` while verifying nothing is the worst failure this project knows, and the hardest
  to spot from the inside.
- **Feature ideas**, as issues.
- **Reports from other stacks** — Lintorn was born on a Django + React project. If the
  detection misfires on your layout, that is valuable information.

## When contributions open: the CLA

Code contributions will require signing a **Contributor License Agreement** before a
pull request can be merged. No exceptions, including for one-line changes.

### Why

Lintorn is released under the **AGPL-3.0**, and is also available under a commercial
license for organisations that cannot comply with the AGPL's source-disclosure
requirement.

That dual model only works while a **single party holds the rights to the whole
codebase**. By default, a contributor keeps copyright over the code they write — so a
single merged pull request without a CLA would make it legally impossible to grant a
commercial license covering that code, permanently and retroactively.

The CLA is not a formality. It is what keeps the project sustainable.

### What it will say

The agreement will follow the shape of the widely used
[Apache Individual CLA](https://www.apache.org/licenses/icla.pdf):

- you **keep** the copyright on your contribution;
- you grant a perpetual, worldwide, irrevocable licence to use, modify, sublicense
  and relicense it — which is what makes commercial licensing possible;
- you confirm you have the right to contribute the code (that it is yours, and that no
  employer or client has a claim on it).

Signing is expected to be handled automatically on each pull request.

### If you contribute on company time

Check with your employer first. In many jurisdictions, code written during working
hours belongs to the employer, and you cannot grant these rights alone. This is the
most common reason a CLA cannot be signed — better to find out before writing the code.

## If you fork instead

You are free to fork under the AGPL-3.0. Two obligations come with it: keep the same
licence, and publish your source — including when you offer the software over a
network, which is the specific point of the AGPL compared to the GPL.

You may not use the name **Lintorn** for a fork in a way that suggests it is this
project, or that it is endorsed by it.

## Development setup

See `CLAUDE.md` for the rules that apply when working on Lintorn itself: the founding
principle, the path conventions, and how to run the test suite in both worlds (with and
without Django).

## Questions

Open an issue. For commercial licensing, contact the copyright holder: **Olotorn**.
