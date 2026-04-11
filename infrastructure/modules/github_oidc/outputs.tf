output "role_arn" {
  description = "ARN of the IAM role to set as AWS_DEPLOY_ROLE_ARN in GitHub Secrets"
  value       = aws_iam_role.github_actions.arn
}
