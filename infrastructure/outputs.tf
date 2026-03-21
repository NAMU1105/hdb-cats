output "frontend_url" {
  description = "Public URL of the deployed frontend"
  value       = module.frontend.cloudfront_domain
}

output "frontend_bucket" {
  value = module.frontend.bucket_name
}

output "frontend_distribution_id" {
  value = module.frontend.cloudfront_distribution_id
}

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
