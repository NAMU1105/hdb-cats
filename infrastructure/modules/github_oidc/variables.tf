variable "project" { type = string }
variable "environment" { type = string }
variable "aws_region" { type = string }
variable "github_repo" {
  description = "GitHub repo in owner/repo format (e.g. NAMU1105/hdb-cats)"
  type        = string
}
