output "bucket_name" { value = aws_s3_bucket.images.bucket }
output "bucket_arn" { value = aws_s3_bucket.images.arn }
output "cloudfront_domain" { value = "https://${aws_cloudfront_distribution.cdn.domain_name}" }
output "cloudfront_distribution_id" { value = aws_cloudfront_distribution.cdn.id }
