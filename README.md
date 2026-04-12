# HDB Cats 🐱

**GitHub:** https://github.com/NAMU1105/hdb-cats

A community web-app for Singapore residents to spot and share photos of HDB estate cats on an interactive Singapore map.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Map | React-Leaflet + OpenStreetMap + react-leaflet-cluster |
| Auth | Google OAuth 2.0 (ID token verification) |
| Backend | Node.js (TypeScript) Lambda functions |
| Storage | AWS S3 + CloudFront CDN |
| Database | AWS DynamoDB |
| API | AWS API Gateway HTTP API v2 |
| Infrastructure | Terraform |
| CI/CD | GitHub Actions + AWS OIDC |
| Region | `ap-southeast-1` (Singapore) |

## Project Structure

```
hdb-cats/
├── frontend/                  # React + TypeScript app
├── backend/                   # Lambda handlers (TypeScript → esbuild)
├── e2e/                       # Playwright end-to-end tests
└── infrastructure/
    ├── modules/               # Shared Terraform modules
    │   ├── api/               # API Gateway + Lambda functions
    │   ├── database/          # DynamoDB
    │   ├── frontend/          # S3 + CloudFront (supports Basic Auth)
    │   ├── github_oidc/       # GitHub Actions IAM role (OIDC)
    │   ├── iam/               # Lambda IAM role
    │   └── storage/           # S3 + CloudFront (image CDN)
    └── environments/          # Per-environment Terraform roots
        ├── dev/               # development
        ├── uat/               # user acceptance testing
        └── prod/              # production
```

## Features

- **Interactive Singapore map** centred on Singapore (OpenStreetMap tiles)
- **Cat markers** clustered by proximity, each showing a circular thumbnail
- **Click marker** → sidebar slides in with full photo and details
- **Fullscreen photo viewer** — click any photo to open a fullscreen lightbox; navigate with arrow keys or buttons
- **Multiple photos per spot** — any logged-in user can add more photos to an existing cat sighting
- **Google login** — sign in with your Google account to submit sightings
- **Click the map** → opens upload wizard with location pre-filled
- **Spot a Cat** button → 3-step upload wizard (login required):
  1. Drop/select a photo (client-side optimisation to original + thumbnail)
  2. Click the map to pin the location
  3. Fill in title, HDB block (with OneMap autocomplete), town, description
- **Like / unlike** — heart button on each sighting (login required); rate-limited to prevent spam
- **Share** — share link button copies a direct URL (`?cat=<id>`) or triggers native share sheet on mobile
- **Edit / Delete** — owners can edit metadata or delete their own sightings
- Presigned S3 upload (images go directly from browser to S3, no size limit from Lambda)
- Soft-delete with `X-Admin-Key` header for moderation

## Local Development

### Prerequisites

Create a Google OAuth 2.0 Web Client ID in [Google Cloud Console](https://console.cloud.google.com/):
- Authorized JavaScript origins: `http://localhost:5173`

### Frontend

```bash
cd frontend
cp ../.env.example .env.local
# fill in:
#   VITE_API_BASE_URL=
#   VITE_CLOUDFRONT_DOMAIN=
#   VITE_GOOGLE_CLIENT_ID=
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run build   # bundles all handlers to dist/
npm run test    # unit tests (Vitest)
```

### E2E Tests

```bash
npm install
npx playwright install chromium
VITE_API_BASE_URL=... npm run test:e2e
```

## Environments

| Environment | Branch | Deployment | Access |
|---|---|---|---|
| dev | `develop` | Auto on push | Basic Auth |
| uat | `main` | Auto on push | Basic Auth |
| prod | `main` | After manual approval | Public |

dev and uat frontends are protected by HTTP Basic Auth (set via `TF_VAR_basic_auth_credential`).

## CI/CD

Every push and PR runs:
- TypeScript typecheck (backend + frontend)
- Unit tests with coverage (Vitest)
- Terraform security scan (tfsec)
- SonarCloud analysis

Push to `main` additionally runs Playwright E2E tests.

Deployments are handled by GitHub Actions using AWS OIDC (no long-lived credentials stored):
- Push to `develop` → deploy to **dev**
- Push to `main` → deploy to **uat**, then wait for manual approval → deploy to **prod**

## Deployment

### Infrastructure (first time)

```bash
# Provision an environment (example: dev)
cd infrastructure/environments/dev
terraform init

# Generate Basic Auth credential
echo -n "username:password" | base64

TF_VAR_google_client_id="<client-id>" \
TF_VAR_basic_auth_credential="<base64-credential>" \
terraform apply
```

Terraform outputs the values needed for GitHub Secrets:

| GitHub Secret | Terraform Output |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | `github_actions_role_arn` |
| `FRONTEND_BUCKET` | `frontend_bucket` |
| `CLOUDFRONT_DISTRIBUTION_ID` | `frontend_distribution_id` |
| `VITE_API_BASE_URL` | `api_base_url` |
| `VITE_CLOUDFRONT_DOMAIN` | `cloudfront_domain` |

Set these in **GitHub → Settings → Environments** (separately for `dev`, `uat`, `prod`). Add required reviewers to `prod` to enable the manual approval gate.

### prod uses a locked-down CORS origin

Pass the frontend CloudFront domain when applying prod:

```bash
cd infrastructure/environments/prod
TF_VAR_google_client_id="<client-id>" \
TF_VAR_frontend_domain="https://<cloudfront-domain>" \
terraform apply
```

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/v1/cats` | — | List all active sightings (supports `?town=` filter) |
| `GET` | `/v1/cats/{id}` | optional Google ID token | Get full details; includes `likedByMe` when authenticated |
| `POST` | `/v1/cats` | Google ID token | Save cat metadata after S3 upload |
| `PATCH` | `/v1/cats/{id}` | Google ID token (owner only) | Update title / description / location metadata |
| `DELETE` | `/v1/cats/{id}` | Google ID token (owner) or `X-Admin-Key` | Soft-delete |
| `POST` | `/v1/cats/{id}/photos` | Google ID token | Add a photo to an existing sighting |
| `POST` | `/v1/cats/{id}/like` | Google ID token | Toggle like (rate-limited: 10 req/s, burst 20) |
| `POST` | `/v1/upload-url` | Google ID token | Get presigned S3 PUT URLs (pass `catId` to add photo to existing cat) |

## Map Notes

- Uses **OpenStreetMap** tiles (free, no registration needed)
- For production, consider a tile provider like [Stadia Maps](https://stadiamaps.com/) or self-hosted tiles
- **OneMap search** is used for HDB block autocomplete in the upload form (no credentials needed for search)
- Map is bounded to Singapore's geographic extent — users cannot pan outside
