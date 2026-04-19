# HandSpeak Machine Learning

HandSpeak is an ASL learning application with a FastAPI backend and React frontend.

## Backend

- API framework: FastAPI
- Persistence: Supabase Postgres (via `DB_URL`)
- Gesture inference services: static and dynamic models under `backend/services`

## Frontend

- Vite + React UI
- Consumes backend APIs for auth, study progress, and gesture verification