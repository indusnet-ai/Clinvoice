# ClinVoice AI — Frontend

React 19 + Vite 5 + TypeScript + Tailwind v4 + Redux Toolkit (RTK Query).

## Setup

```bash
cd frontend
npm install
npm run dev
# open http://localhost:5173
```

The Vite config reads env vars from `environments/.env.<mode>` (not the project root).
For local dev the defaults in `environments/.env.dev` point everything (clinic backend, clinvoice AI engine, ABHA, file upload) at `http://localhost:8020` — the single FastAPI service in `../app/`.

## First-time login

1. Start the backend: `cd ../app && uvicorn main:app --port 8020 --reload`
2. Create an account via the backend Swagger UI at `http://localhost:8020/docs` → `POST /user/signup`
3. Seed an API key row for the dictation flow:
   ```sql
   INSERT INTO api_keys (key, user_id) VALUES ('dev-key-123', 1);
   ```
   (Match `VITE_CLINVOICE_API_KEY` in `environments/.env.dev`.)
4. Go to `http://localhost:5173/auth/signin`, sign in with the credentials from step 2.

## Architecture

`src/app/baseApi.ts` routes calls to one of:

| service tag | env var | what it talks to |
| --- | --- | --- |
| `backend` | `VITE_BACKEND_URL` | clinic endpoints (`/user/verify`, `/hospital/*`, `/doctor/*`, `/patient/*`, `/opd/*`, `/opd-case-sheet/*`, `/doctor-slot/*`) — Bearer JWT |
| `clinvoice` | `VITE_CLINVOICE_AI_URL` | AI engine (`/upload_audio`, `/transcript`, `/SOAP_notes`, `/v1/medical_report`, `/v1.1/dental_medical_report`) — `x-api-key` |
| `abha` | `VITE_ABHA_URL` | `/abha_state_code`, `/abha_district_code` |

All three point at the same FastAPI service locally — that backend houses every endpoint.
