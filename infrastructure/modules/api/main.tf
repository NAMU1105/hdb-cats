locals {
  handlers = {
    get_cats       = { name = "getCats",       zip = "${path.module}/../../../backend/dist/getCats/index.js.zip" }
    get_cat        = { name = "getCat",        zip = "${path.module}/../../../backend/dist/getCat/index.js.zip" }
    create_cat     = { name = "createCat",     zip = "${path.module}/../../../backend/dist/createCat/index.js.zip" }
    get_upload_url = { name = "getUploadUrl",  zip = "${path.module}/../../../backend/dist/getUploadUrl/index.js.zip" }
    delete_cat     = { name = "deleteCat",     zip = "${path.module}/../../../backend/dist/deleteCat/index.js.zip" }
  }

  env_vars = {
    DYNAMODB_TABLE_NAME = var.dynamodb_table_name
    S3_BUCKET_NAME      = var.s3_bucket_name
    CLOUDFRONT_DOMAIN   = var.cloudfront_domain
    ALLOWED_ORIGIN      = var.allowed_origin
    ADMIN_API_KEY       = var.admin_api_key
    AWS_NODEJS_CONNECTION_REUSE_ENABLED = "1"
  }
}

# Zip each handler bundle
data "archive_file" "get_cats" {
  type        = "zip"
  source_file = "${path.module}/../../../backend/dist/getCats/index.js"
  output_path = "${path.module}/../../../backend/dist/getCats/index.js.zip"
}

data "archive_file" "get_cat" {
  type        = "zip"
  source_file = "${path.module}/../../../backend/dist/getCat/index.js"
  output_path = "${path.module}/../../../backend/dist/getCat/index.js.zip"
}

data "archive_file" "create_cat" {
  type        = "zip"
  source_file = "${path.module}/../../../backend/dist/createCat/index.js"
  output_path = "${path.module}/../../../backend/dist/createCat/index.js.zip"
}

data "archive_file" "get_upload_url" {
  type        = "zip"
  source_file = "${path.module}/../../../backend/dist/getUploadUrl/index.js"
  output_path = "${path.module}/../../../backend/dist/getUploadUrl/index.js.zip"
}

data "archive_file" "delete_cat" {
  type        = "zip"
  source_file = "${path.module}/../../../backend/dist/deleteCat/index.js"
  output_path = "${path.module}/../../../backend/dist/deleteCat/index.js.zip"
}

# Lambda functions
resource "aws_lambda_function" "get_cats" {
  function_name    = "${var.project}-getCats-${var.environment}"
  role             = var.lambda_role_arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.get_cats.output_path
  source_code_hash = data.archive_file.get_cats.output_base64sha256
  timeout          = 15
  memory_size      = 256
  environment { variables = local.env_vars }
}

resource "aws_lambda_function" "get_cat" {
  function_name    = "${var.project}-getCat-${var.environment}"
  role             = var.lambda_role_arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.get_cat.output_path
  source_code_hash = data.archive_file.get_cat.output_base64sha256
  timeout          = 10
  memory_size      = 256
  environment { variables = local.env_vars }
}

resource "aws_lambda_function" "create_cat" {
  function_name    = "${var.project}-createCat-${var.environment}"
  role             = var.lambda_role_arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.create_cat.output_path
  source_code_hash = data.archive_file.create_cat.output_base64sha256
  timeout          = 15
  memory_size      = 256
  environment { variables = local.env_vars }
}

resource "aws_lambda_function" "get_upload_url" {
  function_name    = "${var.project}-getUploadUrl-${var.environment}"
  role             = var.lambda_role_arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.get_upload_url.output_path
  source_code_hash = data.archive_file.get_upload_url.output_base64sha256
  timeout          = 10
  memory_size      = 256
  environment { variables = local.env_vars }
}

resource "aws_lambda_function" "delete_cat" {
  function_name    = "${var.project}-deleteCat-${var.environment}"
  role             = var.lambda_role_arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.delete_cat.output_path
  source_code_hash = data.archive_file.delete_cat.output_base64sha256
  timeout          = 10
  memory_size      = 256
  environment { variables = local.env_vars }
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project}-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [var.allowed_origin == "*" ? "*" : var.allowed_origin, "http://localhost:5173"]
    allow_methods = ["GET", "POST", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "X-Admin-Key"]
    max_age       = 3600
  }
}

resource "aws_apigatewayv2_stage" "v1" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "v1"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 100
    throttling_rate_limit  = 50
  }
}

# Integrations
resource "aws_apigatewayv2_integration" "get_cats" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_cats.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "get_cat" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_cat.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "create_cat" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.create_cat.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "get_upload_url" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.get_upload_url.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "delete_cat" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.delete_cat.invoke_arn
  payload_format_version = "2.0"
}

# Routes
resource "aws_apigatewayv2_route" "get_cats" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /cats"
  target    = "integrations/${aws_apigatewayv2_integration.get_cats.id}"
}

resource "aws_apigatewayv2_route" "get_cat" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /cats/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.get_cat.id}"
}

resource "aws_apigatewayv2_route" "create_cat" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /cats"
  target    = "integrations/${aws_apigatewayv2_integration.create_cat.id}"
}

resource "aws_apigatewayv2_route" "get_upload_url" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /upload-url"
  target    = "integrations/${aws_apigatewayv2_integration.get_upload_url.id}"
}

resource "aws_apigatewayv2_route" "delete_cat" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "DELETE /cats/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.delete_cat.id}"
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "get_cats" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_cats.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_cat" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_cat.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "create_cat" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.create_cat.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_upload_url" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.get_upload_url.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "delete_cat" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete_cat.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
