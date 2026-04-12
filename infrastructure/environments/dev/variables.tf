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
