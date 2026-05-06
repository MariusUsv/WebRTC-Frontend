# 🌐 WebRTC & WebSocket Frontend - LINKO Chat

Interfața modernă a aplicației de mesagerie **LINKO**, construită cu **React**. Proiectul pune accent pe o experiență de utilizare fluidă (UX), un design premium "Dark Glass" și comunicare ultra-rapidă.

## ✨ Funcționalități UI/UX

*   **Design Midnight Navy:** Tematică întunecată de lux cu gradient profund și efecte de transparență (glassmorphism).
*   **Animații Fluide:** Mesajele apar cu efect de glisare (slide-up), iar butoanele au feedback tactil la interacțiune[cite: 4].
*   **Typing Indicator:** Notificare vizuală animată cu puncte care sar când interlocutorul scrie[cite: 4].
*   **Sistem de Apeluri Video:** Interfață integrată pentru gestionarea apelurilor primite/efectuate via WebRTC.
*   **Bife de Citire (Read Receipts):** Indicatori stil WhatsApp (✓/✓✓) pentru confirmarea livrării și citirii mesajelor.
*   **Lightbox Media:** Vizualizare imagini la dimensiune completă cu fundal blurat la click[cite: 1].

## 🚀 Tehnologii Folosite

*   **Framework:** React[cite: 4]
*   **Stilizare:** CSS-in-JS & Animații Custom[cite: 4]
*   **Comunicare:** WebSockets & WebRTC[cite: 1]
*   **Font:** Inter (Geometric Sans-Serif)

## 📦 Pornire Proiect

1. **Instalarea dependințelor:**
   ```bash
   npm install
Pornirea în modul de dezvoltare:

Bash
npm run dev
Configurare API:
Asigurați-vă că serverul de backend rulează la adresa definită în src/services/api.js (implicit http://127.0.0.1:8000).

📋 Structura Paginii de Chat
Aplicația folosește un layout de tip "App Frame" cu două panouri principale:

Panoul Stâng: Gestionare contacte și istoricul apelurilor[cite: 1].

Panoul Drept: Conversația activă, istoricul mesajelor și bara de compunere (emoji, fișiere, text)[cite: 1].

Dezvoltat cu ❤️ de MariusUsv
