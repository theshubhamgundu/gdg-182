# 🇮🇳 **JanAI – Generative AI Assistant for Civic Access**

> **Empowering Every Citizen Through Voice-First AI**  
> _Built for Digital India • Inclusive • Intelligent • Accessible_

![JanAI Banner](https://github.com/theshubhamgundu/hackathon-oct-2025/blob/main/assets/janAi.jpg)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-hackathon-orange.svg)]()
[![AI](https://img.shields.io/badge/AI-LLaMA%203.3%20%2B%20RAG-green.svg)]()

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [Key Features](#-key-features)
- [Technical Architecture](#-technical-architecture)
- [Technology Stack](#-technology-stack)
- [User Journey](#-user-journey)
- [Innovation Highlights](#-innovation-highlights)
- [Impact Metrics](#-impact-metrics)
- [Team](#-team)
- [Installation](#-installation)

---

## 🚨 Problem Statement

India’s e-governance revolution is rapidly expanding — but **digital accessibility** remains a major challenge:

- **150M+ senior citizens** struggle with digital portals  
- **Low-literate users** can’t navigate forms or legal jargon  
- **Privacy concerns** when sharing documents via WhatsApp  
- **Language barriers** exclude non-English speakers  
- **Lack of human-like help** in local languages  

> **Core Challenge:**  
> How can we use Generative AI to help every citizen — even those who can’t read or type — access government schemes, documents, and services independently?

---

## 💡 Solution Overview

**JanAI** is a **voice-first, multilingual Generative AI assistant** designed to make government services simple, secure, and human-like.

With **speech, vision, and intelligent retrieval**, JanAI can:
- Explain official documents  
- Help apply for schemes  
- Answer civic questions  
- Guide users step-by-step — all through voice or chat  

### Vision

> “AI that speaks your language and understands your world.”  

Our mission is to make government access **as easy as talking to a friend** — no typing, no confusion, just help.

### Target Users

- Senior citizens (65+)
- Low-literate & rural citizens
- Non-English speakers
- Visually impaired users
- Citizens with digital anxiety

---

## ✨ Key Features

| Category | Feature | Description |
|----------|----------|-------------|
| 🧠 **Conversational AI** | **Civic Query Assistant** | Chatbot powered by LLaMA 3.3 (Groq) for scheme help, FAQs & government queries |
| 🗂 **Scheme Finder** | **AI-based Scheme Discovery** | Finds eligible central/state schemes based on location & profile |
| 🧾 **Document Simplifier** | **Gov Doc Summarizer** | Simplifies and explains complex government forms or circulars |
| 🧮 **Scheme Comparator** | **Compare Schemes Side-by-Side** | Shows benefits, eligibility & documents required |
| 📍 **Geo-Intelligence** | **Location-Aware Schemes** | Suggests schemes available in your state, district, or mandal |
| 🔊 **Voice & Accessibility** | **Voice-first Interface** | Multilingual STT + TTS + emoji-aided interface for seniors |
| 📷 **OCR + AI Understanding** | **Document Reader** | Reads scanned documents or PDFs using OCR + summarization |
| 🧠 **Concise Response Engine** | **Token-Efficient Replies** | Automatically generates short, precise answers (uses 40% fewer tokens) |
| 💬 **Context Memory** | **Conversation Retention** | Remembers chat context for follow-up questions |
| 🧩 **API Integration** | **Groq + RAG Backend** | Uses Groq API with LLaMA 3.3 for ultra-fast reasoning |
| 🔐 **Privacy First** | **Secure Data Handling** | No sensitive data stored — all ephemeral requests |

---

## 🏗 Technical Architecture

┌────────────────────────────────────────────┐
│ JanAI Client (React) │
│ • Voice & Chat UI │
│ • Simple, Large Touch Interface │
│ • Localized in 12+ Indian languages │
└────────────────────┬───────────────────────┘
│
▼
┌────────────────────────────────────────────┐
│ Node.js Backend (API Gateway) │
│ • Routes AI, Speech, and Gov API requests │
│ • Proxy for Groq API (LLaMA 3.3) │
│ • Token limiter + Response optimizer │
└────────────────────┬───────────────────────┘
│
▼
┌────────────────────────────────────────────┐
│ AI Pipeline (RAG + LLaMA) │
│ • Groq LLaMA 3.3 (70B Versatile) │
│ • Retrieval Augmented Generation (RAG) │
│ • Document Simplification Engine │
│ • Scheme Discovery Logic │
└────────────────────┬───────────────────────┘
│
▼
┌────────────────────────────────────────────┐
│ Vector & Gov Data Layer │
│ • Supabase + pgvector for embeddings │
│ • Indexed government documents │
│ • Scheme catalog by state/district │
└────────────────────────────────────────────┘



---

## 🛠 Technology Stack

| Layer | Technology | Purpose |
|-------|-------------|---------|
| **Frontend** | React | Voice & Chat UI |
| **Backend** | Node.js + Express | API orchestration layer |
| **AI Engine** | Groq (LLaMA 3.3-70B) | Conversational & reasoning model |
| **Speech** | Grok TTS | Voice input/output |
| **OCR** | Tesseract / Google Vision | Document scanning |
| **Auth** | OTP + supabase | Secure login |
| **Hosting** | Vercel  |

---

## 👤 User Journey Example

### Senior Citizen Applying for a Ration Card

1️⃣ Open JanAI app
2️⃣ Say “I want a new ration card”
3️⃣ AI explains the process in simple Hindi
4️⃣ Guides user step-by-step:
• Check eligibility
• Upload required documents
• Submit online/offline
5️⃣ Reads aloud confirmation:
“Your ration card application is submitted.
You’ll get an SMS when it’s verified.”


> **Result:** A citizen applies independently — no agent, no confusion.

---


## 🌟 Innovation Highlights

### 🧩 1. Concise AI Engine
- Uses custom system prompts to keep responses short and token-efficient  
- Dynamic truncation ensures replies <150 words  

### 🧠 2. Government-Verified RAG
- All answers grounded in official govt data sources  
- Source citations prevent misinformation  

### 🗣 3. Accessibility-First UI
- Large icons, bilingual text, and voice interaction  
- Especially designed for elderly & low-literate citizens  

### ⚙️ 4. Fast LLM Inference via Groq
- LLaMA 3.3 on Groq gives sub-second responses  
- No latency, ideal for conversational interfaces  

### 💬 5. Local Language Intelligence
- Handles Hindi-English mix seamlessly  
- Translates state schemes into the user’s native language  

---

## 📊 Impact Metrics (Projected)

| Metric | Target |
|--------|--------|
| Citizens Reached | 1 Million+ |
| Avg. Query Time | < 2 seconds |
| Govt Scheme Discovery Rate | +60% |
| Elderly Adoption | 100K users in 6 months |
| Language Support | 22 Indian languages |
| Cost Reduction | 70% lower than intermediaries |

---

## ⚙️ Installation & Setup

```bash
# Clone the repo
git clone https://github.com/theshubhamgundu/janai.git

# Navigate to backend
cd janai/backend

# Install dependencies
npm install

# Add your environment variables
cp .env.example .env
# (Include GROQ_API_KEY, SUPABASE_URL, SUPABASE_KEY, etc.)

# Run backend
npm run dev

# Access API
http://localhost:3001

💖 Built with Passion for Digital India

Making government access simple, secure, and human for everyone.
“Because every citizen deserves a voice in the digital era.”
