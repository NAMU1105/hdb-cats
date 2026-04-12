output "api_base_url" {
  description = "Set this as VITE_API_BASE_URL in the frontend"
  value       = module.api.api_url
}

output "cloudfront_domain" {
  description = "Set this as VITE_CLOUDFRONT_DOMAIN in the frontend"
  value       = module.storage.cloudfront_domain
}

output "s3_bucket_name" {
  value = module.storage.bucket_name
}

output "dynamodb_table_name" {
  value = module.database.table_name
}

output "github_actions_role_arn" {
  description = "Set this as AWS_DEPLOY_ROLE_ARN in GitHub Secrets"
  value       = module.github_oidc.role_arn
}
