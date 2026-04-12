variable "google_client_id" {
  description = "Google OAuth 2.0 client ID"
  type        = string
}

variable "admin_api_key" {
  description = "Secret key for admin DELETE endpoint (set via TF_VAR_admin_api_key)"
  type        = string
  sensitive   = true
  default     = ""
}

variable "frontend_domain" {
  description = "Frontend CloudFront domain for CORS — lock this down in prod (e.g. https://dzv9rq3nsqubp.cloudfront.net)"
  type        = string
  default     = "*"
}

variable "basic_auth_credential" {
  description = "Base64-encoded user:password to protect the frontend (run: echo -n 'user:pass' | base64)"
  type        = string
  sensitive   = true
  default     = ""
}
