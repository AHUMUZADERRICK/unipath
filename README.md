# UniPath - Ugandan University Course Qualification System

UniPath is an MVP admissions qualification platform that computes PUJAB admission weight from UACE and UCE performance, applies the female bonus, and lists public university courses a student qualifies for.

## Tech Stack

- Backend: Django + Django REST Framework
- Frontend: React (Vite)
- Database: PostgreSQL

## Runtime Requirement

- Backend Python: 3.10+

## Core Features

- Enter UACE subjects and grades
- Choose from a Uganda A-Level subject catalog
- Enter UCE grades
- Apply PUJAB weighting rules:
  - UACE points: `A=6, B=5, C=4, D=3, E=2, O=1, F=0`
  - Subject category multipliers: `essential=3, relevant=2, desirable=1, other=0.5`
  - UCE bonus points: `D1-D2=0.3, C3-C6=0.2, P7-P8=0.1, F9=0`
  - Female bonus: `+1.5`
- Compare against course cutoffs and return eligible courses
- Persist student submissions for audit
- Per-course eligibility explanations in API responses
- Admin CSV upload to refresh course cutoffs yearly

## Uganda Dataset Scope

This project now ships with an expanded Uganda-focused reference dataset:

- Full A-Level subject catalog used by the application UI and backend validation
- Public university programs across STEM, health, business, education, and humanities
- Course-specific essential/relevant/desirable subject weighting

Cutoffs are modeled from recent public admissions patterns and are intended as guidance for qualification estimation, not an official replacement for yearly PUJAB release tables.

## API Endpoint

### `POST /api/auth/signup`

Request body:

```json
{
  "first_name": "Amina",
  "last_name": "Nabukeera",
  "email": "amina@example.com",
  "password": "StrongPass123",
  "confirm_password": "StrongPass123",
  "whatsapp_number": "+256700123456",
  "index_number": "U1234/001",
  "gender": "female"
}
```

### `POST /api/auth/login`

Request body:

```json
{
  "email": "amina@example.com",
  "password": "StrongPass123"
}
```

### `POST /api/admin/login`

Request body:

```json
{
  "username": "admin",
  "password": "Admin@12345"
}
```

### `GET /api/admin/dashboard`

Requires header: `Authorization: Bearer <token>`

Returns core admin metrics and recent submission activity.

### `GET /api/admin/users`

Requires admin bearer token. Returns candidate user list for management.

### `PATCH /api/admin/users/{candidate_id}`

Requires admin bearer token. Updates candidate profile fields.

### `GET /api/admin/courses`

Requires admin bearer token. Returns course and cutoff list.

### `PATCH /api/admin/courses/{course_id}/cutoff`

Requires admin bearer token. Updates live cutoff and optional cutoff history for a year.

### `GET /api/admin/templates/cutoff-csv`

Requires admin bearer token. Downloads the exact staff CSV template for course cutoff uploads.

### `GET /api/admin/templates/cutoff-history-csv`

Requires admin bearer token. Downloads the exact staff CSV template for annual cutoff history uploads.

### `POST /api/admin/cutoffs/upload`

Requires admin bearer token and accepts Excel `.xlsx`/`.xlsm` file upload (`multipart/form-data`).

Expected sheet columns:

- `university` (required)
- `course` (required)
- `cutoff_weight` (required)
- `year` (optional)
- `duration` (optional)

### `POST /api/calculate-weight`

Request body:

```json
{
  "candidate_id": 1,
  "uace_results": {
    "Mathematics": "B",
    "Physics": "C",
    "Chemistry": "B",
    "ICT": "C"
  },
  "uce_grades": ["D1", "C3", "C4", "C5", "D2"]
}
```

`gender` can still be supplied directly if `candidate_id` is not provided.

### `GET /api/uace-subjects`

Response:

```json
{
  "subjects": ["Agriculture", "Biology", "Chemistry", "Mathematics", "..."]
}
```

Response:

```json
{
  "final_weight": 44.6,
  "eligible_courses": [
    {
      "course": "Computer Science",
      "university": "Makerere University",
      "cutoff": 43.0,
      "calculated_weight": 44.6,
      "explanation": "Eligible: essential subjects satisfied and weight meets or exceeds cutoff."
    }
  ],
  "course_evaluations": [
    {
      "course": "Computer Science",
      "university": "Makerere University",
      "cutoff": 43.0,
      "calculated_weight": 44.6,
      "is_eligible": true,
      "missing_essential_subjects": [],
      "explanation": "Eligible: essential subjects satisfied and weight meets or exceeds cutoff."
    }
  ]
}
```

## Data Model

- `University`
- `Course`
- `Subject`
- `CourseSubjectRequirement`
- `StudentSubmission`
- `StudentResult`
- `UCEGrade`

Migrations include sample public universities and courses for MVP testing.

## Run Instructions

## 1. Start PostgreSQL

```bash
docker compose up -d db
```

## 2. Backend setup

```bash
cd backend
python3.10 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

If your machine only exposes a newer interpreter command, any Python 3.10+ version is supported (for example `python3.13 -m venv .venv`).

Backend runs at `http://localhost:8000`.

If Docker/PostgreSQL is unavailable locally, you can run with SQLite fallback:

```bash
cd backend
USE_SQLITE=1 python manage.py migrate
USE_SQLITE=1 python manage.py runserver
```

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Admin CSV Upload For Cutoffs

1. Log in to Django admin.
2. Open Courses.
3. Use one of the templates:
  - "Download CSV Template" for full course refresh (including duration).
  - "Download History CSV Template" for annual cutoff-history updates.
4. Click "Upload Cutoffs CSV".
5. Upload a CSV with columns:
  - `university`
  - `course`
  - `cutoff_weight`
  - optional `year`
  - optional `duration`

This updates/creates courses and, when `year` is provided, writes cutoff history.

## Project Structure

- `backend/config/` Django project settings and URL routing
- `backend/apps/admissions/` admissions domain, APIs, and weight engine
- `frontend/src/` React app and multi-step qualification UI
