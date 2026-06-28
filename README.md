# Doctor App Voice (ASHWIN AI)

End-to-end voice-to-EMR app. A doctor records a consultation, the audio is transcribed and diarized live, then SOAP notes / medical reports / FHIR bundles are generated — all powered by **OpenAI** (`whisper-1` for speech-to-text, `gpt-4.1` for the LLM passes).

```
doctor-app-voice/
├── backend/          # FastAPI service (port 8020) — auth, hospital, doctor, patient, OPD, AI engine, WebSocket streaming
├── frontend/         # React 19 + Vite + Redux Toolkit (port 5173)
└── migration.sql     # One-shot SQL to create every table the app uses
```

## Stack

* **Backend:** Python 3.11+ · FastAPI · async SQLAlchemy · Postgres · OpenAI · WebSocket streaming
* **Frontend:** React 19 · Vite · TypeScript · Tailwind v4 · Redux Toolkit (RTK Query) · Formik · Wavesurfer.js
* **Data store:** Postgres only. No Redis required for the sync path; ARQ worker (optional) uses Redis for async jobs.
* **No GPU needed.** Everything runs on a laptop.

---

## 1. Install Postgres (one-time)

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Ubuntu:**
```bash
sudo apt install postgresql
sudo systemctl start postgresql
```

## 2. Create the database

```bash
psql postgres -c "CREATE USER ashwin WITH PASSWORD 'ashwin';" \
              -c "CREATE DATABASE ashwin_db OWNER ashwin;" \
              -c "GRANT ALL PRIVILEGES ON DATABASE ashwin_db TO ashwin;"
```

## 3. Create the tables (single SQL file)

```bash
psql postgresql://ashwin:ashwin@localhost:5432/ashwin_db -f migration.sql
```

Verify:
```bash
psql postgresql://ashwin:ashwin@localhost:5432/ashwin_db -c '\dt'
```
You should see ~25 tables.

---

## 4. Backend setup

```bash
cd backend
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=sk-...

python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

uvicorn main:app --port 8020 --reload
```

Health-check at <http://localhost:8020/docs>.

> **Note:** the app reads `DATABASE_URL` with the `+asyncpg` driver — keep that prefix.

## 5. Frontend setup

```bash
cd frontend
cp environments/.env.development.example environments/.env.development

npm install
npm run dev
```

Open <http://localhost:5173/auth/signup>. Create an account — the signup endpoint **auto-seeds an `api_keys` row** with the value the frontend uses (`dev-key-123`), so the AI dictation flow works immediately after signup.

---

## End-to-end smoke test

1. **Sign up** at `/auth/signup` → you're logged in and redirected to the onboarding wizard.
2. **Onboarding** — fill Hospital Info, Doctor Info. Voice + Signature are optional and can be skipped.
3. **Settings → Slots** — add a slot window for today's weekday and Save.
4. **Dashboard → + New OPD** — search a mobile number, "Add New Patient", pick the slot, Save.
5. **Click into the patient row** → consultation page opens.
6. Press **Start Recording** and read aloud:
   > "Good morning, I've been having a bad headache for three days. It gets worse in the evening, and bright light makes it hurt more. I've also had some nausea. My BP today is 130 over 85. Let's try Sumatriptan 50 mg as needed, and Pantoprazole 40 mg in the morning for two weeks. Drink more water, cut down on coffee, and come back in two weeks if it doesn't improve."
7. Press **Stop**. Within a few seconds the **Transcript** tab populates, then **SOAP Notes**.
8. Switch to **Manual** — vitals, symptoms, diagnosis, medication, diet, follow-up are pre-filled by the AI.
9. **End Consultation** → status flips to `completed`, you're returned to the dashboard.

---

## What's running

| Service | URL | Purpose |
|---|---|---|
| FastAPI | `http://localhost:8020` | All HTTP endpoints (auth, hospital, doctor, patient, OPD, AI) |
| FastAPI WS | `ws://localhost:8020/ws/stream_transcription` | Live audio transcription |
| Static uploads | `http://localhost:8020/uploads/...` | Logos, certificates, signatures, voice samples |
| Vite | `http://localhost:5173` | Frontend dev server |
| Postgres | `localhost:5432` | Single source of truth |

### Frontend → Backend URL contract

`src/app/baseApi.ts` routes each request to one of three "services" — but all three resolve to the same FastAPI service:

| service tag | env var | what it talks to |
| --- | --- | --- |
| `backend` | `VITE_BACKEND_URL` | Clinic endpoints (auth + hospital + doctor + patient + OPD + slots + case-sheet). JWT Bearer. |
| `ashwin` | `VITE_ASHWIN_AI_URL` | AI engine (`/upload_audio`, `/transcript`, `/SOAP_notes`, `/v1/medical_report`, `/v1.1/dental_medical_report`). Uses `x-api-key`. |
| `abha`   | `VITE_ABHA_URL`    | `/abha_state_code`, `/abha_district_code` for state/district pickers. |

### Deleting cached AI outputs

The backend caches each AI generation per `transcript_id`. If you change the prompt, drop the cached rows to force regeneration:
```bash
psql postgresql://ashwin:ashwin@localhost:5432/ashwin_db <<SQL
DELETE FROM medical_reports_v1;
DELETE FROM soap_notes_v1;
SQL
```

---

## What to send a colleague

To give a teammate a working copy:

1. They clone this repo:
   ```bash
   git clone https://github.com/indusnet-ai/Clinvoice.git
   cd Clinvoice
   ```
2. They install Postgres locally (Step 1 above) and create the database (Step 2).
3. They run the migration:
   ```bash
   psql postgresql://ashwin:ashwin@localhost:5432/ashwin_db -f migration.sql
   ```
4. They copy `.env.example` files and add **their own** OpenAI key:
   * `backend/.env.example` → `backend/.env` (set `OPENAI_API_KEY`)
   * `frontend/environments/.env.development.example` → `frontend/environments/.env.development`
5. They follow Backend setup (Step 4) + Frontend setup (Step 5).

That's it — they get a fully working local copy.

---

## Pushing to GitHub for the first time

From this directory:
```bash
git init
git add .
git commit -m "Initial commit: Doctor App Voice (ASHWIN AI) on OpenAI"
git branch -M main
git remote add origin https://github.com/indusnet-ai/Clinvoice.git
git push -u origin main
```

If GitHub asks for credentials, use a Personal Access Token instead of a password (Settings → Developer settings → Personal access tokens → generate a token with `repo` scope).

## Repository structure

```
doctor-app-voice/
├── README.md                      # this file
├── migration.sql                  # full database schema, idempotent
├── .gitignore                     # excludes .env, .venv, node_modules, uploads
├── backend/
│   ├── main.py                    # FastAPI app entrypoint
│   ├── requirements.txt
│   ├── .env.example
│   ├── alembic.ini
│   ├── api/router/clinic/         # /user, /hospital, /doctor, /patient, /opd, /opd-case-sheet, /doctor-slot, /abha, /file, /ws/stream_transcription
│   ├── api/router/v0/             # legacy AI endpoints (/upload_audio, /SOAP_notes, /fhir-bundle, NRCES bundles, ...)
│   ├── api/router/v1/             # newer AI endpoints (/v1/medical_report, /v1/soap_notes, ...)
│   ├── api/utils/                 # JWT, hashing, file upload, cost calc, schemas
│   ├── core/                      # config, lifespan, job_queue
│   ├── db/                        # models.py, database.py
│   ├── services/vertex/           # OpenAI client + chat-completion wrappers (folder name is historical)
│   ├── services/nrces_fhir/       # NRCES bundle builders
│   ├── prompts/                   # System prompts for every AI endpoint
│   ├── resources/                 # FHIR resource builders (Condition, Observation, ...)
│   ├── migrations/                # Alembic migrations (you don't need these if you used migration.sql)
│   └── workers/                   # ARQ worker (optional async path)
└── frontend/
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── index.html
    ├── environments/.env.development.example
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── app/baseApi.ts         # Three-service router
        ├── features/auth          # SignIn, SignUp, Forgot/Reset password
        ├── features/onboard       # Hospital + Doctor + Voice + Signature wizard
        ├── features/dashboard     # OPD list, New OPD modal, Consultation page (recording + AI)
        ├── features/patient       # Patient CRUD
        ├── features/settings      # Hospital info, Doctor info, Voice & Signature, Slots
        └── features/visithistory  # Past consultation PDFs
```
