# ⚡ LINKO — Web Client (Frontend)

Acesta este clientul web pentru aplicația **LINKO**, construit cu focus pe viteză, securitate și o experiență de utilizare fluidă (Zero-Lag). Aplicația procesează criptarea și conexiunile P2P exclusiv în browser, garantând confidențialitatea utilizatorilor.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-P2P_Video-333333?logo=webrtc)

## 🏗️ Arhitectură și Structură

Proiectul nu folosește soluții generice (precum Socket.io), ci implementează conexiuni native pentru a menține un control strict asupra securității și performanței. Logica aplicației este separată pe responsabilități (Separation of Concerns) folosind Custom Hooks:

* 📁 **`src/hooks/`** - "Creierul" aplicației.
  * `useE2EE.js`: Gestionează derivarea cheilor AES cu Web Crypto API și previne spam-ul de request-uri către API prin memoizare (`useRef`).
  * `useChat.js`: Gestionează starea mesajelor, indicatorii de typing și Optimistic UI-ul (afișarea instantanee a mesajelor).
  * `useWebRTC.js`: Gestionează complet fluxurile media (cameră/microfon) și conexiunea P2P.
  * `useWebSocket.js`: Orchestratorul principal care rutează pachetele către chat sau WebRTC.
* 📁 **`src/services/`** - Utilitare (apeluri API, formatare, SFX, servicii criptografice).
* 📁 **`src/components/`** - Componente de UI reutilizabile (Avatar, EmojiPicker, MessageBubble).
* 📁 **`src/pages/`** - Vizualizările principale (`Login.jsx`, `ChatPage.jsx`).

## ✨ Funcționalități Frontend-Only

* **Optimistic UI:** Mesajele apar instantaneu pe ecran la apăsarea butonului de trimitere, oferind iluzia unui ping de 0ms, confirmarea serverului venind silențios în fundal.
* **Drag & Drop Interactiv:** Interfața reacționează vizual (overlay blurat) când un fișier este tras peste ecran.
* **Eroare și Feedback (UX):** Folosind `react-hot-toast`, orice eroare de rețea sau permisiune hardware (ex. cameră blocată) este comunicată elegant utilizatorului.
* **Design "Aurora Noir":** 3 teme dinamice (Dark, Light, Cosmic) gestionate global prin variabile CSS și sincronizate cu `localStorage`.

## 🚀 Instalare și Rulare Locală

### 1. Configurare Variabile de Mediu
Creează un fișier `.env` în rădăcina folderului `frontend`:
```env
VITE_API_URL=[http://127.0.0.1:8000](http://127.0.0.1:8000)
VITE_WS_URL=ws://127.0.0.1:8000/ws
(Notă: Pentru producție, înlocuiește cu URL-urile de la Render/Backend).

2. Instalare Dependințe
Bash
npm install
3. Pornire Server de Dezvoltare
Bash
npm run dev
4. Build pentru Producție
Bash
npm run build
Aplicația va fi compilată și optimizată în folderul /dist, pregătită pentru deploy pe Vercel, Netlify sau Cloudflare Pages.
