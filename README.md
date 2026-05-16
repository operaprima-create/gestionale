# 🎙 Opera Prima — Gestionale Eventi

App di gestione eventi musicali per Rebecca ed Enea.

---

## 🚀 Avvio rapido locale

```bash
npm install
npm run dev
# → apri http://localhost:5173
```

---

## 🌐 Deploy su Vercel (risolto l'errore)

L'errore precedente era dovuto alla struttura delle cartelle. Ora è tutto corretto.

### Passi:
1. Vai su [vercel.com](https://vercel.com) → **Add New Project**
2. Importa il repository GitHub `opera-prima-gestionale`
3. Vercel rileva Vite automaticamente — clicca **Deploy**
4. Condividi l'URL con Enea ✅

---

## 👥 Condivisione dati in tempo reale con Enea

Senza Supabase, i dati sono salvati solo nel browser locale — Enea non vede nulla.
**Con Supabase**, ogni modifica è visibile in tempo reale a entrambi.

### Step 1 — Crea il progetto Supabase (5 minuti, gratuito)

1. Vai su [supabase.com](https://supabase.com) → **Start your project**
2. Crea un account con Google o email
3. Clicca **New project** → dai un nome (es. `opera-prima`) → scegli una password → seleziona regione **West EU (Ireland)** → **Create project**
4. Aspetta ~1 minuto che il progetto sia pronto

### Step 2 — Crea la tabella eventi

Nel pannello Supabase, vai su **SQL Editor** e incolla questo:

```sql
create table events (
  id text primary key,
  data jsonb not null,
  created_at timestamptz default now()
);

-- Abilita accesso pubblico (per semplicità — puoi aggiungere auth dopo)
alter table events enable row level security;
create policy "allow all" on events for all using (true) with check (true);

-- Abilita realtime
alter publication supabase_realtime add table events;
```

Clicca **Run** ▶️

### Step 3 — Copia le chiavi API

Nel pannello Supabase: **Settings → API**

Copia:
- **Project URL** → es. `https://abcdefgh.supabase.co`
- **anon / public key** → la stringa lunga che inizia con `eyJ...`

### Step 4 — Aggiungi le variabili su Vercel

Su Vercel: **tuo progetto → Settings → Environment Variables**

Aggiungi:
| Nome | Valore |
|------|--------|
| `VITE_SUPABASE_URL` | `https://abcdefgh.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` (la chiave lunga) |

Clicca **Save** → poi **Deployments → Redeploy**

### Step 5 — Condividi con Enea

Manda ad Enea il link Vercel. Entrambi vedete e modificate gli stessi dati in tempo reale. 🎉

---

## 📄 Preventivo Canva

Il pulsante **"Preventivo Canva"** appare nelle schede con stato **Confermato**.

- **Automatico** — funziona nell'app Claude.ai (dove Canva è integrato). Claude genera il documento con tutti i dati compilati.
- **Da template** — apre Canva con un template da modificare manualmente. Funziona ovunque.

---

## 💰 Listino prezzi integrato

| | 1 mus. | 2 mus. | 3 mus. | 4 mus. |
|--|--------|--------|--------|--------|
| **Classica** | €400 | €650 | €800 | €900 |
| **Pop** | €350 | €600 | €750 | €900 |

| Karaoke | DJ | DJ + Karaoke |
|---------|-----|--------------|
| €200 | €500 | €600 |

**Costo musicisti (interno):** 200€ primo momento + costo variabile per ogni momento aggiuntivo.

---

## 🗂 Struttura progetto

```
opera-prima/
├── src/
│   ├── main.jsx         ← entry point
│   ├── App.jsx          ← app principale
│   ├── constants.js     ← costanti (momenti, strumenti, prezzi)
│   ├── utils.js         ← calcoli e utilità
│   ├── storage.js       ← Supabase / localStorage
│   └── supabase.js      ← client Supabase
├── public/
│   └── favicon.svg
├── index.html           ← entry HTML (corretto per Vite)
├── vite.config.js
├── package.json
├── .env.example         ← template variabili ambiente
└── .gitignore
```

---

## 🎵 Funzionalità

- ☀️🌙 Tema chiaro / scuro (logo sempre su sfondo nero)
- 📅 Calendario 2024–2027
- 📋 Lista con filtri e ricerca
- 💍 Scheda matrimonio completa (consulenza, servizi, follow up, esito)
- 🎼 Formazioni musicali per ogni momento
- 💡 Prezzi automatici dal listino
- 📊 Bilancio con quota Rebecca / Enea
- 📄 Generazione preventivo su Canva
- 🟢 Sync in tempo reale tra Rebecca ed Enea (con Supabase)

---

*Opera Prima · Rebecca & Enea*
