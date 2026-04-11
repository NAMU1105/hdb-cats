variable "project" { type = string }
variable "environment" { type = string }
variable "lambda_role_arn" { type = string }
variable "dynamodb_table_name" { type = string }
variable "s3_bucket_name" { type = string }
variable "cloudfront_domain" { type = string }
variable "allowed_origin" { type = string }
variable "admin_api_key" {
  type      = string
  sensitive = true
}
variable "aws_region" { type = string }
variable "google_client_id" { type = string }
