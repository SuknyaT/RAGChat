# Audience Builder AI

A chat-based audience builder for advertising campaigns. Media planners can describe their target audience in plain English, and an AI agent translates that into structured targeting signals from a provided taxonomy.

## Features
- **Natural Language Interpretation:** Describe audiences like "fitness enthusiasts aged 25-44" and get structured signals.
- **Taxonomy Integration:** Maps requests to real targeting fields from the provided Excel data.
- **Audience Sizing:** Heuristic engine to estimate reach based on signal specificity.
- **Conversation Persistence:** Resumable chat history stored in SQLite.
- **Role-Based Auth:** Supports `admin` and `planner` roles.
- **Premium UI:** Sleek, glassmorphism-inspired design with smooth animations.

## Tech Stack
- **Frontend:** React, TypeScript, Vite, Vanilla CSS, Framer Motion, Lucide Icons.
- **Backend:** Node.js, Express, TypeScript, SQLite.
- **AI:** Gemini 1.5 Flash (via Google AI Studio).

## Prerequisites
- Node.js (v18+)
- A Gemini API Key from [Google AI Studio](https://a Studio.google.com/)

## Setup Instructions

### 1. Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file and add your `GEMINI_API_KEY`.
4. Start the server:
   ```bash
   npm run dev
   ```
   *Note: On first run, the server will seed the taxonomy data from `data/*.json` into `database.sqlite`.*

### 2. Frontend Setup
1. Navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Login Credentials
- **Admin:** `admin` / `admin123`
- **Planner:** `planner` / `planner123`

## Design Decisions

### AI Strategy: RAG-Lite
Instead of training a model, I implemented a "RAG-Lite" approach. When a user sends a message, the server searches the SQLite taxonomy for relevant keywords and injects those matches into the Gemini system prompt. This ensures the model maps to *actual* targeting codes available in your data.

### Audience Sizing
Since no count data was provided, I built a **Heuristic Engine**. It uses a base population of 250M and applies diminishing multipliers for each signal added. This provides a realistic estimation that reflects the specificity of the audience.

### Persistence
SQLite was chosen for its simplicity and single-file nature, making the assessment easy to run while still providing full relational power for conversations and taxonomy searches.

### UI/UX: WOW Aesthetics
I avoided generic UI frameworks to create a custom "Glassmorphism" design system. It uses translucent layers, deep gradients, and Framer Motion for a premium, modern feel that exceeds standard MVP expectations.
