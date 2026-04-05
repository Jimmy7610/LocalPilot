# LocalPilot 🚀

**LocalPilot** är ditt personliga, oberoende kontrollcenter för lokal AI. Istället för att lita på molntjänster kör du kraftfulla AI-modeller (via Ollama) direkt på din egen hårdvara. 100% integritet, ingen spårning, och total kontroll.

Byggt för power-users som vill ha en polerad, privat och praktisk miljö för AI-stöttat arbete.

---

## 🛠 Vad är LocalPilot?

LocalPilot kombinerar chatt, projektorganisering, dokumenthantering och avancerade AI-verktyg i en och samma skrivbordsapplikation. Det är bryggan mellan dina lokala AI-modeller och ditt faktiska arbetsflöde.

### Nyckelfunktioner

- **🤖 Avancerad Chatt** — Fullfjädrad chattupplevelse med streaming, markdown, kod-highlighting och smart modellval.
- **📂 Projekt-isolerat Minne** — Organisera ditt arbete i Projekt. AI:n "minns" kontexten för specifika uppdrag genom att knyta samman dokument och chattar.
- **📟 Terminal Manager** — En modern, svävande (floating island) terminal där du kan köra kod och övervaka bakgrundsprocesser direkt i appen.
- **📑 Dokument & RAG** — Ladda upp textreferenser som AI:n använder som facit (Retrieval-Augmented Generation).
- **⚡ Snabbverktyg** — Färdiga verktyg för att sammanfatta, skriva om, översätta eller städa upp anteckningar med ett klick.
- **🔄 Säker Omstart** — Inbyggd funktion för att starta om både frontend och backend med ett klick för att rensa minne eller synka ändringar.
- **🌓 Dark & Light Mode** — Premium-design med stöd för både mörkt och ljust tema.

---

## 🎨 Designfilosofi

- **Local-first:** Din data lämnar aldrig din maskin.
- **Premium UX:** En ren, intelligent och fokuserad design som känns som en modern macOS/Windows-app.
- **Transparens:** Övervaka exakt vad AI:n gör via den inbyggda terminalen.

---

## 💻 Technical Stack

LocalPilot är byggt med den senaste tekniken för maximal prestanda och säkerhet:

- **Desktop Shell:** [Tauri 2](https://tauri.app) (Rust-baserat för minsta möjliga footprint)
- **Frontend:** React 19 + TypeScript + Vite 7
- **Styling:** Tailwind CSS 4 (för den där premium-känslan)
- **State Management:** Zustand 5
- **Persistence:** SQLite via `tauri-plugin-sql`
- **AI Backend:** [Ollama](https://ollama.com) (lokal instans på `localhost:11434`)
- **Process Management:** `tauri-plugin-process` för kontroll av bakgrundskörningar

---

## 🚀 Kom igång

### 1. Förutsättningar
- [Node.js](https://nodejs.org) 18+
- [Rust](https://rustup.rs) (för Tauri-kompilering)
- [Ollama](https://ollama.com) installerat och igång

### 2. Installation
```bash
git clone https://github.com/Jimmy7610/LocalPilot.git
cd LocalPilot
npm install
```

### 3. Kör i utvecklingsläge
```bash
# För desktop-appen (Tauri + SQLite)
npm run tauri dev

# Endast frontend (i webbläsaren)
npm run dev
```

---

## ⌨️ Kortkommandon

| Kommando | Aktion |
|----------|--------|
| `Ctrl+K` | Öppna Overlay / Quick Access |
| `Enter` | Skicka meddelande |
| `Shift+Enter` | Ny rad i chatten |

---

## 📝 Roadmap

- [ ] Import av PDF-dokument
- [ ] RAG-stöd för hela mappar (Workspace sync)
- [ ] Export av chattar till Markdown/JSON
- [ ] Fler agentiska verktyg i Terminalen
- [ ] Global hotkey för system-tray minimize

---

## Licens
MIT

---

**Utvecklad med omsorg av Jimmy.**
*Local-first AI for the rest of us.*
