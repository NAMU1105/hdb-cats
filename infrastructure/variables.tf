variable "project" {
  description = "Project name prefix for all resources"
  type        = string
  default     = "hdb-cats"
}

variable "environment" {
  description = "Deployment environment (prod, staging)"
  type        = string
  default     = "prod"
}

variable "aws_region" {
  description = "AWS region — keep in Singapore for data residency"
  type        = string
  default     = "ap-southeast-1"
}

variable "frontend_domain" {
  description = "Frontend domain for CORS (e.g. https://hdbcats.sg)"
  type        = string
  default     = "*"
}

variable "admin_api_key" {
  description = "Secret key for admin DELETE endpoint (set via TF_VAR_admin_api_key env var)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "google_client_id" {
  description = "Google OAuth 2.0 client ID for verifying user ID tokens"
  type        = string
}

variable "github_repo" {
  description = "GitHub repo in owner/repo format — scopes the OIDC trust policy to your repo only"
  type        = string
  default     = "NAMU1105/hdb-cats"
}


variable "app_admin_id" {
  description = "Administrator user ID for the app (set via TF_VAR_app_admin_id env var) to limit user access to the services"
  type        = string
  default     = "prod-admin-namu"
}

variable "app_admin_pw" {
  description = "Administrator user password for the app (set via TF_VAR_app_admin_pw env var) to limit user access to the services"
  type        = string
  default     = "prod-admin-namu"
}

