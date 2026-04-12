variable "project" { type = string }
variable "environment" { type = string }
variable "basic_auth_credential" {
  description = "Base64-encoded user:password for Basic Auth (e.g. run: echo -n 'user:pass' | base64). Empty string disables auth. Used to restrict access on non-prod environments."
  type        = string
  sensitive   = true
  default     = ""
}
