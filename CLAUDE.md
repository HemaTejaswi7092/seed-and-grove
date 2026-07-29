# Session Instructions

When starting a new session:

1. Read this file completely.
2. Read PROJECT_STATUS.md.
3. Read NEXT_STEPS.md.
4. Understand the existing architecture before making changes.
5. Never remove or redesign working functionality unless explicitly instructed.
6. When a feature is completed, update PROJECT_STATUS.md and NEXT_STEPS.md before finishing.

# Seed & Grove — Claude Development Guide

This file provides guidance to Claude Code (claude.ai/code) when working in this repository.

---
## Current Status

Before making any code changes:

1. Read PROJECT_STATUS.md
2. Read NEXT_STEPS.md
3. Understand the existing architecture.
4. Continue the current sprint instead of starting new features.
5. Update both files before ending the session.

## Repository Structure

src/
- React application

supabase/
- SQL migrations
- Database setup
- Feature scripts

PROJECT_STATUS.md
- Completed work and milestones

NEXT_STEPS.md
- Active sprint and upcoming work

CLAUDE.md
- Project architecture and development guidelines

README.md
- Public project documentation

# Project Vision

Seed & Grove is an AI-native platform where projects become proof, progress becomes identity, and potential becomes opportunity.

Unlike LinkedIn, which focuses on resumes and past experience, Seed & Grove focuses on the actual work candidates build. Every project, prompt, decision, and achievement contributes to a living professional identity.

Seed is where candidates build.

Grove is where they are discovered.

---

# Core Philosophy

Evidence > Resume

Projects > Buzzwords

Achievements > Self-written claims

Semantic understanding > Keyword matching

Never optimize for looking impressive.
Always optimize for demonstrating real work.

---

# Tech Stack

## Frontend

- React
- TypeScript
- Tailwind CSS
- Vite

## Backend

- Supabase
- PostgreSQL
- Row Level Security

## AI

- Groq LLM
- RAG (planned)
- Semantic candidate matching

---

# Commands

Development

```bash
npm run dev
```

Build

```bash
npm run build
```

Lint

```bash
npm run lint
```

Preview

```bash
npm run preview
```

---

# Product Architecture

There are TWO completely separate user experiences.

Candidate

↓

Seed Workspace

↓

Grove

Recruiter

↓

Recruiter Workspace

↓

Recruiter Grove

Never mix Candidate and Recruiter logic.

---

# Candidate Experience

## Dashboard

Contains

- Community Feed
- Search
- Opportunities
- Profile

---

## Seed Workspace

Purpose

AI workspace where projects are built.

Capabilities

- AI mentor
- Prompt history
- Project timeline
- Evidence tracking
- Achievement suggestions
- Manual achievements
- Progress tracking

Seed is NOT a portfolio.

Seed is the workspace.

---

## Evidence

Evidence belongs to Projects.

Evidence can include

- commits

- screenshots

- AI conversations

- technical decisions

- implementation notes

Achievements originate from Evidence.

---

## Achievements

Achievements represent verified outcomes of project work.

Achievements may be

- AI generated

- User edited

- Manually created

Achievements should always be connected to evidence.

---

## Projects

Projects own

- Skills

- Evidence

- Achievements

Never attach Skills directly to users.

Skills are inferred from projects.

---

## Grove

Purpose

Public professional identity.

Sections

- Hero

- About

- Contact

- Projects

- Skills

- Evidence

- Achievements

- Background

Grove is public.

Seed is private.

---

# Recruiter Experience

Recruiters have a completely separate experience.

Includes

- Recruiter Dashboard

- Recruiter Workspace

- Recruiter Grove

- Company Profile

- Job Posting

- Candidate Search

- Candidate Matching

Recruiters should never see Seed internals.

---

# Candidate Matching

Matching should use meaning.

Never rely on keyword overlap alone.

Priority

Evidence

↓

Achievements

↓

Projects

↓

Skills

↓

Profile

Semantic understanding is preferred over keyword matching.

---

# Community Feed

The feed combines activity from

Candidates

Recruiters

Projects

Achievements

Hiring posts

Feed items should encourage discovery rather than social media engagement.

---

# Database Philosophy

Projects

↓

Evidence

↓

Achievements

↓

Grove

Skills are derived from Projects.

Achievements derive from Evidence.

Avoid duplicated data whenever possible.

---

# UI Principles

Modern

Minimal

Fast

Evidence-first

Responsive

Accessible

Consistent spacing

Reusable components

Avoid unnecessary complexity.

---

# Code Guidelines

Use TypeScript.

Prefer reusable React components.

Keep components small.

Avoid duplicate business logic.

Prefer composition over repetition.

Do not refactor unrelated files.

Preserve existing functionality.

---

# Git Guidelines

One feature per commit whenever practical.

Use meaningful commit messages.

Examples

Implement recruiter community feed

Improve semantic candidate ranking

Add recruiter company profile

Avoid large unrelated commits.

---

# Before Writing Code

Always

Read

- PROJECT_STATUS.md

- NEXT_STEPS.md

Understand current progress before making changes.

Do not redesign completed features unless explicitly requested.

---

# After Completing Any Feature

Update

PROJECT_STATUS.md

Move completed tasks out of

NEXT_STEPS.md

Add newly discovered follow-up tasks.

Verify

- npm run build

- npm run lint

Ensure no TypeScript errors.

---

# Current Development Focus

Current priorities include

- Recruiter Grove improvements

- Better semantic candidate matching

- Community Feed polish

- Production-ready UI

- Performance improvements

- Mobile responsiveness

---

# Things to Avoid

Do not merge Candidate and Recruiter experiences.

Do not attach Skills directly to users.

Do not create duplicate database tables.

Do not break existing workflows.

Do not remove working functionality without approval.

---

# Long-Term Vision

Seed becomes the AI operating system for building.

Grove becomes the trusted professional identity generated from real work.

Every project becomes proof.

Every contribution builds credibility.

Every candidate develops a living portfolio instead of a static resume.

## Session Completion Checklist

Before ending every session:

- Verify the application still builds.
- Ensure no TypeScript errors.
- Ensure no lint errors.
- Update PROJECT_STATUS.md if a feature was completed.
- Remove completed tasks from NEXT_STEPS.md.
- Add any newly discovered follow-up tasks.
- Suggest an appropriate Git commit message.