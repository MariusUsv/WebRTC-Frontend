# 💬 Linko Pro — Real-Time Chat & Video (Frontend)

![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![WebRTC](https://img.shields.io/badge/WebRTC-333333?style=for-the-badge&logo=webrtc&logoColor=white)
![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white)

Frontend client for **Linko Pro**, a secure real-time communication platform featuring encrypted messaging and peer-to-peer video calls directly in the browser.

🟢 **Live App:** https://web-rtc-frontend-swart.vercel.app

---

## ⚡ TL;DR
- WebSocket-based real-time messaging  
- Peer-to-Peer video calls via WebRTC  
- End-to-End Encryption (Web Crypto API)  
- Optimistic UI for instant feedback  

---

## 🚀 Core Features
- 💬 **Real-Time Messaging** — instant communication using native WebSockets  
- 🔐 **End-to-End Encryption** — messages encrypted locally (AES-GCM, ECDH)  
- 🎥 **WebRTC Video Calls** — direct P2P connections (no media server)  
- ⚡ **Optimistic UI** — messages rendered instantly before server confirmation  
- 📱 **Responsive Design** — optimized for desktop and mobile  

---

## 🧩 Architecture
src/
├── components/ # UI components (Chat, Video, UI elements)
├── hooks/ # Core logic (useWebSocket, useWebRTC, useE2EE)
├── services/ # API + crypto helpers
├── pages/ # Views (Auth, Chat)
└── App.jsx # Routing & providers


### Core Concepts
- **Custom Hooks** → separation of concerns (logic vs UI)  
- **WebSockets** → messaging + signaling  
- **WebRTC** → media streaming  
- **E2EE Layer** → client-side encryption before transmission  

---

## 🔒 End-to-End Encryption
- Public keys exchanged via backend API  
- Shared secrets derived locally (ECDH)  
- Messages encrypted with AES-GCM  
- Backend only handles ciphertext (Zero-Knowledge)  

---

## 🎥 WebRTC Flow
1. `createOffer()` → sent via WebSocket  
2. Remote client sets `RemoteDescription`  
3. `createAnswer()` → returned to caller  
4. ICE candidates exchanged  
5. Direct P2P connection established  

---

## ⚠️ Key Engineering Challenges
- **Async State Sync** — aligning UI with unpredictable WebSocket events  
- **Media Lifecycle** — handling `getUserMedia`, cleanup, avoiding leaks  
- **WebRTC Timing** — managing signaling order & ICE candidates  
- **Crypto Integration** — running encryption without blocking UI  

---

## 🛠️ Tech Stack
- React 18 + Vite  
- WebSockets API  
- WebRTC (`RTCPeerConnection`)  
- Web Crypto API  
- Vercel (deployment)  

---

## 💻 Local Development
git clone https://github.com/MariusUsv/WebRTC-Frontend.git
cd WebRTC-Frontend
npm install

Create .env:

VITE_API_URL=http://localhost:10000
VITE_WS_URL=ws://localhost:10000/ws

Run:

npm run dev
☁️ Production

Environment variables:

VITE_API_URL=https://your-backend.onrender.com
VITE_WS_URL=wss://your-backend.onrender.com/ws
🔗 Related

Backend: https://github.com/MariusUsv/WebRTC-Backend

⚡ Built with focus on real-time performance, security, and clean architecture.
