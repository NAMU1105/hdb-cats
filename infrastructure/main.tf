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

  # Uncomment to use S3 backend
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "hdb-cats/terraform.tfstate"
  #   region = "ap-southeast-1"
  # }
}

provider "aws" {
  region = var.aws_region
  default_tags {
    tags = {
      Project     = "hdb-cats"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

module "storage" {
  source      = "./modules/storage"
  project     = var.project
  environment = var.environment
  allowed_origin = var.frontend_domain
}

module "database" {
  source      = "./modules/database"
  project     = var.project
  environment = var.environment
}

module "iam" {
  source         = "./modules/iam"
  project        = var.project
  environment    = var.environment
  s3_bucket_arn  = module.storage.bucket_arn
  dynamodb_table_arn = module.database.table_arn
}

module "frontend" {
  source      = "./modules/frontend"
  project     = var.project
  environment = var.environment
}

module "github_oidc" {
  source      = "./modules/github_oidc"
  project     = var.project
  environment = var.environment
  aws_region  = var.aws_region
  github_repo = var.github_repo
}

module "api" {
  source             = "./modules/api"
  project            = var.project
  environment        = var.environment
  lambda_role_arn    = module.iam.lambda_role_arn
  dynamodb_table_name = module.database.table_name
  s3_bucket_name     = module.storage.bucket_name
  cloudfront_domain  = module.storage.cloudfront_domain
  allowed_origin     = var.frontend_domain
  admin_api_key      = var.admin_api_key
  aws_region         = var.aws_region
  google_client_id   = var.google_client_id
}
