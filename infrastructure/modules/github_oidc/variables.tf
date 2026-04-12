variable "project" { type = string }
variable "environment" { type = string }
variable "aws_region" { type = string }
variable "github_repo" {
  description = "GitHub repo in owner/repo format (e.g. NAMU1105/hdb-cats)"
  type        = string
}
variable "create_oidc_provider" {
  description = "Create the GitHub OIDC provider. Only one can exist per AWS account — set false for non-prod environments that share the same account."
  type        = bool
  default     = true
}
