<div align="center">

# 🌱 Seed & Grove

### Your work becomes your professional identity.

An AI-native professional identity platform that transforms real work into verifiable professional evidence.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deployed_on-Vercel-black?logo=vercel)](https://vercel.com)

🌐 **Live Demo:** https://seed-and-grove.vercel.app

</div>

---

# 📖 Overview

Traditional resumes tell recruiters **what candidates claim** they can do.

**Seed & Grove** helps candidates prove what they have actually built.

Instead of manually writing resumes, users document real projects (**Seeds**), capture meaningful achievements, and publish them into a professional public profile (**Grove**) that recruiters can explore.

The platform uses AI to assist users in documenting work while ensuring every published achievement is backed by real project evidence.

---

# ✨ Key Features

## 🌱 Seed Workspace

- AI-assisted project workspace
- Guided project documentation
- Achievement tracking
- Project timeline
- Completion workflow
- Evidence-first publishing

---

## 🏆 Achievement System

Instead of simply marking projects complete, users must document meaningful accomplishments.

Features include:

- AI-generated achievement suggestions
- Manual achievement creation
- Rich evidence
- Technologies used
- Business impact
- Publishing workflow

---

## 🌿 Grove Profile

Every completed project contributes to a public professional profile.

Includes:

- Professional summary
- Published projects
- Verified achievements
- Automatically generated skills
- Education
- Experience
- Certifications

---

## 🤖 AI Copilot

The platform includes an AI assistant capable of:

- Understanding project context
- Suggesting achievements
- Answering project questions
- Remembering previous conversations
- Semantic retrieval
- Personalized assistance

---

## 👔 Recruiter Experience

Recruiters can:

- Browse candidate Groves
- Review published work
- Explore verified achievements
- Search by demonstrated skills
- Evaluate projects instead of resumes

---

# 📸 Screenshots

## Landing Page

> Add screenshot here

![Landing](docs/screenshots/landing.png)

---

## Seed Workspace

> Add screenshot here

![Workspace](docs/screenshots/workspace.png)

---

## Grove Profile

> Add screenshot here

![Grove](docs/screenshots/grove.png)

---

## Recruiter View

> Add screenshot here

![Recruiter](docs/screenshots/recruiter.png)

---

# 🏗 System Architecture

```text
               Candidate
                   │
                   ▼
         Seed Workspace (Projects)
                   │
        AI Achievement Suggestions
                   │
                   ▼
            Verified Achievements
                   │
                   ▼
            Published Projects
                   │
                   ▼
             Grove Profile
                   │
                   ▼
        Recruiter Discovery
```

---

# 🤖 AI Workflow

```text
Project Conversation
        │
        ▼
 Context Retrieval
        │
        ▼
 AI Copilot
        │
        ▼
 Achievement Suggestions
        │
        ▼
 User Review
        │
        ▼
 Published Evidence
        │
        ▼
 Grove
```

---

# 🛠 Tech Stack

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- React Router

---

## Backend

- Supabase
- PostgreSQL
- Edge Functions
- Row Level Security

---

## AI

- Groq API
- Llama Models
- Semantic Search
- Vector Embeddings
- Retrieval-Augmented Generation (RAG)

---

## Deployment

- Vercel

---

# 📂 Project Structure

```text
seed-and-grove/

├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── contexts/
│   ├── hooks/
│   ├── lib/
│   ├── services/
│   └── types/
│
├── supabase/
│   ├── functions/
│   └── migrations/
│
├── docs/
├── scripts/
└── README.md
```

---

# 🚀 Getting Started

## Clone Repository

```bash
git clone https://github.com/HemaTejaswi7092/seed-and-grove.git

cd seed-and-grove
```

---

## Install Dependencies

```bash
npm install
```

---

## Environment Variables

Create a `.env.local` file:

```env
VITE_SUPABASE_URL=your_supabase_url

VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Start Development Server

```bash
npm run dev
```

---

# 🗄 Database Overview

Main entities:

- Users
- Projects
- Achievements
- Skills
- Grove Profiles
- Recruiters
- Jobs
- Feed
- Semantic Memory

---

# 🔒 Security

- Supabase Authentication
- Row Level Security (RLS)
- Protected API routes
- Secure environment variables
- Server-side AI integration

---

# 🌍 Deployment

Hosted on **Vercel**

Production:

https://seed-and-grove.vercel.app

---

# 🚧 Roadmap

## Completed

- Candidate workspace
- AI Copilot
- Achievement workflow
- Grove profile
- Recruiter dashboard
- Feed system
- Authentication
- Semantic search

## Planned

- GitHub integration
- AI project summaries
- Team collaboration
- Public API
- Mobile support

---

# 👨‍💻 Author

**Pavan Kumar Bathula**

M.S. Computer Science  
University of Central Florida

GitHub: https://github.com/HemaTejaswi7092

LinkedIn: *(Add your profile link)*

---

# 📜 License

This project is licensed under the MIT License.
