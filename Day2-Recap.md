# GH-900 · Day 2 Recap

Collaboration, open source, InnerSource, security, administration and GitHub automation.

📘 [Course notes / repo walkthrough](README.md) · ⬅️ [Day 1 Recap](Day1-Recap.md)

---

## Contents

1. [Contributing to open source](#1-contributing-to-open-source)
2. [Managing an InnerSource program](#2-managing-an-innersource-program)
3. [Secure repository best practices](#3-secure-repository-best-practices)
4. [Administration and authentication](#4-administration-and-authentication)
5. [GitHub Projects](#5-github-projects)
6. [GitHub Actions](#6-github-actions)
7. [GitHub Copilot](#7-github-copilot)
8. [Exam focus](#8-exam-focus)

---

## 1. Contributing to open source

Open source projects let anyone view, use, modify and improve the code.

### The contribution workflow

```
Find a repository
   ↓
Fork it to your account
   ↓
Create a branch
   ↓
Make changes → Commit
   ↓
Open a Pull Request
   ↓
Maintainers review and approve
```

### Key terms

| Term | Meaning |
| --- | --- |
| **Fork** | A copy of a repository in *your own* account |
| **Pull request** | A request to merge your changes back |
| **Upstream repository** | The original repository you forked from |
| **Contributor** | Someone who submits changes |

### Why contribute

- Learn from real projects
- Build a portfolio
- Collaborate with developers worldwide
- Improve your coding skills

> **Exam tip:** Know the difference between a **fork** and a **branch**. A fork creates a copy in
> *your own account*; a branch stays *inside the same repository*.

---

## 2. Managing an InnerSource program

InnerSource means applying open-source collaboration practices *inside* an organization.

**Benefits**

- Reuse existing code
- Reduce duplicated work
- Improve collaboration between teams
- Increase transparency

**Features that make it work:** Organizations, Repositories, Issues, Discussions, Pull Requests and
Projects.

### Repository ownership

| | Personal repository | Organization repository |
| --- | --- | --- |
| Owned by | An individual user | The company or team |
| Governance | Limited | Roles, teams, policies |
| Best for | Personal projects | Anything with more than one contributor |

> **Exam tip:** Most enterprise projects belong under a GitHub **Organization**, not a personal
> account.

---

## 3. Secure repository best practices

### Shift left

Introduce security *early* in the development lifecycle rather than waiting until deployment. The
earlier a problem is found, the cheaper it is to fix.

### The security features

| Feature | What it does |
| --- | --- |
| **Code scanning / CodeQL** | Analyses source code for vulnerabilities and unsafe patterns |
| **Secret scanning** | Detects API keys, passwords, tokens and connection strings |
| **Dependabot** | Finds vulnerable dependencies, suggests updates, opens pull requests |

> **Exam tip:** **Dependabot** handles *dependency* security. **CodeQL** performs *code* analysis.
> They solve different problems.

### Repository security files

**`.gitignore`** — keeps files out of the repository entirely: temporary files, build output,
secrets and local configuration.

**`SECURITY.md`** — explains how to report a vulnerability, who to contact, and the responsible
disclosure process.

### Branch protection

Used to protect important branches such as `main`:

- Require pull requests
- Require approvals
- Require status checks to pass
- Prevent force pushes

> This repository does exactly that — see
> [the ruleset protecting `main`](README.md#44-rulesets--enforcing-the-process), and
> [Dependabot's live pull requests](README.md#5-security).

---

## 4. Administration and authentication

### Authentication methods

| Method | Notes |
| --- | --- |
| Username + password | Not recommended |
| **Personal Access Token (PAT)** | More secure alternative for Git operations |
| **Two-factor authentication (2FA/MFA)** | Adds a second proof of identity |
| **SAML single sign-on (SSO)** | Enterprise centralised identity management |

### Permission levels

| Level | Can |
| --- | --- |
| **Read** | View the repository |
| **Triage** | Manage issues and pull requests |
| **Write** | Push code and create branches |
| **Maintain** | Manage repository settings |
| **Admin** | Full control |

### Organizational structure

```
Enterprise
 └─ Organization
      └─ Repository
           └─ Teams
```

> **Exam tip:** Understand the permission levels and how Organizations control access.

---

## 5. GitHub Projects

Projects track and manage work.

**Views:** Board · Table · Roadmap

**A typical flow**

```
Backlog → In Progress → In Review → Done
```

**Items on a board:** issues, pull requests and draft tasks.

**Benefits:** better visibility, easier planning, clear progress tracking.

---

## 6. GitHub Actions

GitHub's built-in automation platform, used to build CI/CD workflows.

| | What it automates |
| --- | --- |
| **Continuous Integration (CI)** | Build code, run tests, validate every change |
| **Continuous Deployment (CD)** | Deploy applications, publish packages, release updates |

A workflow is triggered by events:

```yaml
on:
  push:
  pull_request:
```

**Benefits:** less manual work, consistent results, problems caught early.

> **Exam tip:** GitHub Actions is GitHub's native automation and CI/CD solution.
>
> See the real thing: [this repo's CI/CD pipeline](README.md#6-the-pipeline-cicd) — `ci.yml` runs the
> tests and CodeQL, and `cd.yml` builds container images and deploys to Azure.

---

## 7. GitHub Copilot

An AI coding assistant that helps developers write code, explain code, generate tests, create
documentation and troubleshoot problems.

**Good for:** function creation, refactoring, unit testing, code explanation, documentation.

> **Exam tip:** Copilot assists — it does not replace human review. Always validate AI-generated
> code before it reaches production.

---

## 8. Exam focus

Know these well:

- ✅ Open source workflow: Fork → Branch → Commit → Pull Request
- ✅ InnerSource concepts
- ✅ GitHub Organizations
- ✅ Branch protection
- ✅ Dependabot
- ✅ CodeQL
- ✅ Secret scanning
- ✅ GitHub Actions (CI/CD)
- ✅ Authentication: PAT, MFA, SAML SSO
- ✅ GitHub Projects
- ✅ GitHub Copilot basics

### A memory aid

```
Plan → Code → Secure → Automate → Collaborate
```

| Step | With |
| --- | --- |
| **Plan** | Projects |
| **Code** | Repositories and Copilot |
| **Secure** | CodeQL and Dependabot |
| **Automate** | Actions |
| **Collaborate** | Pull requests and Organizations |

This sequence maps closely to the Day 2 learning objectives, and is useful for both the certification
and real-world GitHub work.

---

⬅️ Back: [Day 1 Recap](Day1-Recap.md) · 📘 [See it all applied in this repo](README.md)
