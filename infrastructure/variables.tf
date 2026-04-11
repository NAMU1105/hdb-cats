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
