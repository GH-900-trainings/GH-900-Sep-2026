# GH-900 · Day 1 Recap

Foundations of Git and GitHub, and how they support modern software development teams.

📘 [Course notes / repo walkthrough](README.md) · ➡️ [Day 2 Recap](Day2-Recap.md)

---

## Contents

1. [Git and version control](#1-git-and-version-control)
2. [Git vs GitHub](#2-git-vs-github)
3. [Core GitHub terminology](#3-core-github-terminology)
4. [GitHub Organizations](#4-github-organizations)
5. [Project management with Issues and Projects](#5-project-management-with-issues-and-projects)
6. [GitHub Copilot](#6-github-copilot)
7. [Security from day one](#7-security-from-day-one)
8. [Labs](#8-labs)
9. [Key takeaways](#9-key-takeaways)
10. [Practice after class](#10-practice-after-class)

---

## 1. Git and version control

Software projects change constantly, and several developers often touch the same files at the same
time. Without version control, one person's changes silently overwrite another's.

**The problem, concretely.** Developer A adds a feature while Developer B fixes a bug, both editing
the same application:

| Without Git | With Git |
| --- | --- |
| Work gets lost | Every change is tracked |
| Changes overwrite each other | Previous versions can be restored |
| Collaboration is painful | Teams work in parallel safely |

**Where version control is used** — it is not only for application code:

- Application development
- Database scripts
- Infrastructure as Code
- Configuration management
- Documentation
- Any shared project a team works on together

---

## 2. Git vs GitHub

A common early confusion. They are not the same thing.

| | Git | GitHub |
| --- | --- | --- |
| What it is | Version control system | Cloud platform built around Git |
| Where it runs | Installed locally | Hosted online |
| Provides | Change tracking, history, merging | Collaboration, security, automation, project management, AI |

Similar platforms include **GitLab** and **Bitbucket** — all host repositories and use the same
underlying Git concepts.

> **Remember:** Git is the tool. GitHub is the place teams collaborate using that tool.

---

## 3. Core GitHub terminology

| Term | Meaning |
| --- | --- |
| **Repository (repo)** | Storage for source code, documentation, project files and work items |
| **README** | The documentation file that explains a project and how to set it up |
| **Commit** | A snapshot of changes made to a repository |
| **Branch** | A separate working area for development |
| **Issue** | A work item: feature, bug, task or improvement |
| **Pull request** | The mechanism to review and merge changes into the main codebase |

> See these live: [branches and pull requests in this repo](README.md#4-working-in-github).

---

## 4. GitHub Organizations

Rather than one person owning everything, an Organization lets a company own and govern its
repositories.

**Benefits**

- Team-based access control
- Role management
- Security governance
- Collaboration across an enterprise

**A real structure.** A company might have developers, security engineers, platform administrators
and database administrators all working together with different levels of access.

---

## 5. Project management with Issues and Projects

GitHub is more than source control — it can run the whole project.

**Issues** represent features, enhancements, bugs or user stories.

**Projects** give a visual, Kanban-style view of progress:

```
Backlog → In Progress → Review → Done
```

**Benefits:** visibility, sprint planning, prioritisation and team collaboration.

The weather application in this repository was used to demonstrate Epics, user stories, tasks,
milestones and roadmaps — see [how the Epics and Sub-Tasks are structured](README.md#41-issues--planning-the-work).

---

## 6. GitHub Copilot

An AI assistant for developers. It can generate code, suggest implementations, explain code, create
project structures and help troubleshoot.

| Mode | Use it to |
| --- | --- |
| **Ask** | Ask questions about code and architecture |
| **Plan** | Produce an implementation plan before any code is written |
| **Agent** | Carry out coding tasks autonomously |

**What we actually built with it.** The backend weather service in this repo — project structure,
dependencies, API endpoints, the Azure Maps connection, configuration files and documentation.

**Why it matters:** less time on boilerplate, more time on the business problem.

> **Important:** Copilot assists developers, it does not replace human review. Always read and
> validate generated code before shipping it.

---

## 7. Security from day one

The key lesson: **never put secrets in source code.** That includes API keys, passwords, connection
strings and authentication tokens.

**Use instead:** environment variables, secret stores, and proper configuration management.

> In this repo the Azure Maps key lives in a gitignored `.env` locally and in an encrypted GitHub
> secret in CI/CD — [see how](README.md#5-security).

---

## 8. Labs

| Lab | Covers |
| --- | --- |
| **Lab 1 — Try Out Git** | Basic Git concepts, commands, working with repositories |
| **Lab 2 — A Guided Tour of GitHub** | Interface, repositories, issues, projects, collaboration |

Labs can be completed in the lab environment, on your local machine, or in your personal GitHub
account.

---

## 9. Key takeaways

- ✅ Git tracks changes and enables collaboration
- ✅ GitHub adds cloud collaboration, project management, security and automation on top of Git
- ✅ Repositories store source code and project artifacts
- ✅ Issues and Projects manage the work
- ✅ Organizations simplify team collaboration and governance
- ✅ Copilot accelerates development through code and plan generation
- ✅ Security starts at the beginning, especially around credentials and API keys
- ✅ Modern development is more than coding: planning, collaboration, testing, security, deployment

---

## 10. Practice after class

1. Create a personal GitHub repository.
2. Add a README and document a small project.
3. Practise the core Git commands: `clone`, `add`, `commit`, `push`.
4. Finish any outstanding GH-900 labs.
5. Explore GitHub Projects and Issues.
6. Try GitHub Copilot Free and compare Ask, Plan and Agent modes.
7. Build a small application and manage its whole lifecycle in GitHub.

---

➡️ Next: [Day 2 Recap](Day2-Recap.md) — collaboration, open source, security, administration and automation.
