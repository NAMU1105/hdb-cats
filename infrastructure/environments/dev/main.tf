terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = local.aws_region
  default_tags {
    tags = {
      Project     = local.project
      Environment = local.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  project     = "hdb-cats"
  environment = "dev"
  aws_region  = "ap-southeast-1"
  github_repo = "NAMU1105/hdb-cats"
}

module "storage" {
  source         = "../../modules/storage"
  project        = local.project
  environment    = local.environment
  allowed_origin = "*"
}

module "database" {
  source      = "../../modules/database"
  project     = local.project
  environment = local.environment
}

module "iam" {
  source             = "../../modules/iam"
  project            = local.project
  environment        = local.environment
  s3_bucket_arn      = module.storage.bucket_arn
  dynamodb_table_arn = module.database.table_arn
}

module "frontend" {
  source                = "../../modules/frontend"
  project               = local.project
  environment           = local.environment
  basic_auth_credential = var.basic_auth_credential
}

module "github_oidc" {
  source               = "../../modules/github_oidc"
  project              = local.project
  environment          = local.environment
  aws_region           = local.aws_region
  github_repo          = local.github_repo
  create_oidc_provider = false
}

module "api" {
  source              = "../../modules/api"
  project             = local.project
  environment         = local.environment
  lambda_role_arn     = module.iam.lambda_role_arn
  dynamodb_table_name = module.database.table_name
  s3_bucket_name      = module.storage.bucket_name
  cloudfront_domain   = module.storage.cloudfront_domain
  allowed_origin      = "*"
  admin_api_key       = var.admin_api_key
  aws_region          = local.aws_region
  google_client_id    = var.google_client_id
}
