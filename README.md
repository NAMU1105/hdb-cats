# HDB Cats 🐱

**GitHub:** https://github.com/NAMU1105/hdb-cats

A community web-app for Singapore residents to spot and share photos of HDB estate cats on an interactive Singapore map.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Map | React-Leaflet + OpenStreetMap + react-leaflet-cluster |
| Backend | Node.js (TypeScript) Lambda functions |
| Storage | AWS S3 + CloudFront CDN |
| Database | AWS DynamoDB |
| API | AWS API Gateway HTTP API v2 |
| Infrastructure | Terraform |
| Region | `ap-southeast-1` (Singapore) |

## Project Structure

```
hdb-cats/
├── frontend/          # React + TypeScript app
├── backend/           # Lambda handlers (TypeScript → esbuild)
└── infrastructure/    # Terraform modules
    └── modules/
        ├── storage/   # S3 + CloudFront
        ├── database/  # DynamoDB
        ├── iam/       # Lambda IAM role
        └── api/       # API Gateway + Lambda functions
```

## Features

- **Interactive Singapore map** centred on Singapore (OpenStreetMap tiles)
- **Cat markers** clustered by proximity, each showing a circular thumbnail
- **Click marker** → sidebar slides in with full photo and details
- **Spot a Cat** button → 3-step upload wizard:
  1. Drop/select a photo (client-side optimisation to original + thumbnail)
  2. Click the map to pin the location
  3. Fill in title, HDB block (with OneMap autocomplete), town, description
- Presigned S3 upload (images go directly from browser to S3, no size limit from Lambda)
- Soft-delete with `X-Admin-Key` header for moderation

## Local Development

### Frontend

```bash
cd frontend
cp ../.env.example .env.local   # fill in VITE_API_BASE_URL and VITE_CLOUDFRONT_DOMAIN
npm install
npm run dev
```

### Backend (local testing)

```bash
cd backend
npm install
npm run build        # bundles all handlers to dist/
```

You can test handlers locally with `aws-lambda-ric` or just invoke them directly.

## Deployment

### 1. Build the backend

```bash
cd backend && npm run build
```

This produces `backend/dist/<HandlerName>/index.js` for each Lambda.

### 2. Deploy infrastructure

```bash
cd infrastructure
cp terraform.tfvars.example terraform.tfvars   # fill in your values
export TF_VAR_admin_api_key="your-secret-key"
terraform init
terraform plan
terraform apply
```

Terraform outputs:
- `api_base_url` → set as `VITE_API_BASE_URL` in frontend
- `cloudfront_domain` → set as `VITE_CLOUDFRONT_DOMAIN` in frontend

### 3. Build & deploy the frontend

```bash
cd frontend
VITE_API_BASE_URL=<from terraform output> \
VITE_CLOUDFRONT_DOMAIN=<from terraform output> \
npm run build
# Upload dist/ to S3 or any static host (Vercel, Cloudflare Pages, etc.)
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/v1/cats` | List all active sightings (supports `?town=` filter) |
| `GET` | `/v1/cats/{id}` | Get full details of a sighting |
| `POST` | `/v1/cats` | Save cat metadata after S3 upload |
| `POST` | `/v1/upload-url` | Get presigned S3 PUT URLs |
| `DELETE` | `/v1/cats/{id}` | Soft-delete (requires `X-Admin-Key` header) |

## Map Notes

- Uses **OpenStreetMap** tiles (free, no registration needed)
- For production, consider a tile provider like [Stadia Maps](https://stadiamaps.com/) or self-hosted tiles
- **OneMap search** is used for HDB block autocomplete in the upload form (no credentials needed for search)
- Map is bounded to Singapore's geographic extent — users cannot pan outside
