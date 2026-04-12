locals {
  handlers = {
    get_cats       = { name = "getCats",       zip = "${path.module}/../../../backend/dist/getCats/index.js.zip" }
    get_cat        = { name = "getCat",        zip = "${path.module}/../../../backend/dist/getCat/index.js.zip" }
    create_cat     = { name = "createCat",     zip = "${path.module}/../../../backend/dist/createCat/index.js.zip" }
    get_upload_url = { name = "getUploadUrl",  zip = "${path.module}/../../../backend/dist/getUploadUrl/index.js.zip" }
    delete_cat     = { name = "deleteCat",     zip = "${path.module}/../../../backend/dist/deleteCat/index.js.zip" }
    update_cat     = { name = "updateCat",     zip = "${path.module}/../../../backend/dist/updateCat/index.js.zip" }
    toggle_like    = { name = "toggleLike",    zip = "${path.module}/../../../backend/dist/toggleLike/index.js.zip" }
    add_cat_photo  = { name = "addCatPhoto",   zip = "${path.module}/../../../backend/dist/addCatPhoto/index.js.zip" }
  }

  env_vars = {
    DYNAMODB_TABLE_NAME = var.dynamodb_table_name
    S3_BUCKET_NAME      = var.s3_bucket_name
    CLOUDFRONT_DOMAIN   = var.cloudfront_domain
    ALLOWED_ORIGIN      = var.allowed_origin
    ADMIN_API_KEY       = var.admin_api_key
    GOOGLE_CLIENT_ID    = var.google_client_id
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

data "archive_file" "update_cat" {
  type        = "zip"
  source_file = "${path.module}/../../../backend/dist/updateCat/index.js"
  output_path = "${path.module}/../../../backend/dist/updateCat/index.js.zip"
}

data "archive_file" "toggle_like" {
  type        = "zip"
  source_file = "${path.module}/../../../backend/dist/toggleLike/index.js"
  output_path = "${path.module}/../../../backend/dist/toggleLike/index.js.zip"
}

data "archive_file" "add_cat_photo" {
  type        = "zip"
  source_file = "${path.module}/../../../backend/dist/addCatPhoto/index.js"
  output_path = "${path.module}/../../../backend/dist/addCatPhoto/index.js.zip"
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

resource "aws_lambda_function" "update_cat" {
  function_name    = "${var.project}-updateCat-${var.environment}"
  role             = var.lambda_role_arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.update_cat.output_path
  source_code_hash = data.archive_file.update_cat.output_base64sha256
  timeout          = 10
  memory_size      = 256
  environment { variables = local.env_vars }
}

resource "aws_lambda_function" "toggle_like" {
  function_name    = "${var.project}-toggleLike-${var.environment}"
  role             = var.lambda_role_arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.toggle_like.output_path
  source_code_hash = data.archive_file.toggle_like.output_base64sha256
  timeout          = 10
  memory_size      = 256
  environment { variables = local.env_vars }
}

resource "aws_lambda_function" "add_cat_photo" {
  function_name    = "${var.project}-addCatPhoto-${var.environment}"
  role             = var.lambda_role_arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  filename         = data.archive_file.add_cat_photo.output_path
  source_code_hash = data.archive_file.add_cat_photo.output_base64sha256
  timeout          = 10
  memory_size      = 256
  environment { variables = local.env_vars }
}

# CloudWatch Log Group for API Gateway access logs
resource "aws_cloudwatch_log_group" "api_gw" {
  name              = "/aws/apigateway/${var.project}-${var.environment}"
  retention_in_days = 30
}

# API Gateway HTTP API
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project}-api-${var.environment}"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [var.allowed_origin == "*" ? "*" : var.allowed_origin, "http://localhost:5173"]
    allow_methods = ["GET", "POST", "PATCH", "DELETE", "OPTIONS"]
    allow_headers = ["Content-Type", "Authorization", "X-Admin-Key"]
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

  # Tighter limit on the like toggle to prevent spamming
  route_settings {
    route_key              = "POST /cats/{id}/like"
    throttling_burst_limit = 20
    throttling_rate_limit  = 10
  }

  depends_on = [aws_apigatewayv2_route.toggle_like]

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gw.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      responseLength = "$context.responseLength"
      sourceIp       = "$context.identity.sourceIp"
      userAgent      = "$context.identity.userAgent"
      errorMessage   = "$context.error.message"
    })
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

resource "aws_apigatewayv2_integration" "update_cat" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.update_cat.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "toggle_like" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.toggle_like.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_integration" "add_cat_photo" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.add_cat_photo.invoke_arn
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

resource "aws_apigatewayv2_route" "update_cat" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "PATCH /cats/{id}"
  target    = "integrations/${aws_apigatewayv2_integration.update_cat.id}"
}

resource "aws_apigatewayv2_route" "toggle_like" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /cats/{id}/like"
  target    = "integrations/${aws_apigatewayv2_integration.toggle_like.id}"
}

resource "aws_apigatewayv2_route" "add_cat_photo" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /cats/{id}/photos"
  target    = "integrations/${aws_apigatewayv2_integration.add_cat_photo.id}"
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

resource "aws_lambda_permission" "update_cat" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.update_cat.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "toggle_like" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.toggle_like.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

resource "aws_lambda_permission" "add_cat_photo" {
  statement_id  = "AllowAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.add_cat_photo.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
