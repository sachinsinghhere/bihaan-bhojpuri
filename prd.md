📜 Project: Bihaan Bhojpuri (Digital Literature Archive)

1. Project Intent
   Build a minimalist, distraction-free blog for a Bhojpuri writer. The focus is on high-readability, cultural elegance, and zero-cost maintenance. The site must serve as a "digital gem" for poems and stories.

2. Technical Stack (Free Tier Optimized)
   Frontend: Next.js 15+ (App Router)

Styling: Tailwind CSS + Shadcn UI

Backend/CMS: Sanity.io (Free Tier)

Editor: BlockNote or TipTap (Medium-like Slash commands)

Fonts: Google Fonts (Devanagari specialized)

Hosting: Vercel

3. Design & Aesthetics (The "Zen" Guide)
   A. Typography (Critical for Bhojpuri/Devanagari)
   Bhojpuri in Devanagari script requires specific spacing and stroke weights to look professional.

Primary Font (Headings): Tiro Devanagari Hindi — It has a classic, literary feel used in high-end books.

Secondary Font (Body Text): Noto Serif Devanagari — Extremely readable for long stories.

System Backup: Inter (for English/UI elements).

B. Color Palette (The "Literature" Theme)
Avoid pure black/white. Use these "paper-like" tones to reduce eye strain:

Background: #FDFCF8 (Soft Cream/Eggshell)

Text: #1A1A1A (Off-black for high contrast)

Accents: #5F6F52 (Muted Sage Green) or #8C6A5D (Clay Brown) for categories/dates.

Dividers: #E5E7EB (Subtle light gray).

4. Core Features & User Stories
   Medium-Style Writing: Author can type / to insert an Image, YouTube Video, or a Divider.

The "Safety Net": Sanity Studio must be configured with liveEdit: true. This ensures every keystroke is saved as a draft instantly.

Language Support: The editor and the frontend must support UTF-8 Devanagari characters perfectly.

SEO Ready: Every post should automatically generate a slug from the title (even Hindi/Bhojpuri titles).

5. Implementation Instructions for the AI Agent
   Phase 1: Setup
   Initialize a Next.js project.

Install Sanity and create a schema for Post:

title (string)

slug (slug)

category (Stories/Poems)

body (portableText / rich text)

publishedAt (datetime)

Set up NextAuth with Google Provider for the /admin dashboard.

Phase 2: The Editor
Integrate BlockNote into the Sanity custom input or a custom Next.js admin page.

Ensure images uploaded in the editor are stored in Sanity’s CDN.

Phase 3: The Reader UI
Create a "Home" feed with a clean grid of cards.

Create a "Post View" that uses a max-w-2xl container for a focused reading experience.

Add a "Share to WhatsApp" button (popular for Bhojpuri literary circles).

🛑 Instructions for the AI Agent
Stop and Ask: If you are unsure how to handle Devanagari slugs or if a library choice affects the free-tier status, ask me before proceeding.

Font Check: Ensure that the Google Fonts are imported with the devanagari subset specifically.

Step-by-Step: First, build the Sanity schema and show me the "Writing Interface." Once I approve the writing experience, move to the frontend design.

Migration: After the site is live, I will need your help to scrape/import content from bihaanbhojpuri.wordpress.com.
