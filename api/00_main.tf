locals {
  lambda_zip_path = "${path.module}/lambda.zip"
}

# DynamoDB Tables
resource "aws_dynamodb_table" "group_permissions" {
  name           = "group-permissions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "group_name"
  range_key      = "service_action"

  attribute {
    name = "group_name"
    type = "S"
  }

  attribute {
    name = "service_action"
    type = "S"
  }

  attribute {
    name = "service"
    type = "S"
  }

  attribute {
    name = "action"
    type = "S"
  }

  # GSI for querying by service_action
  global_secondary_index {
    name               = "ServiceActionIndex"
    hash_key          = "service_action"
    projection_type    = "ALL"
  }

  # GSI for querying by service
  global_secondary_index {
    name               = "ServiceIndex"
    hash_key          = "service"
    range_key         = "action"
    projection_type    = "ALL"
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "user_groups" {
  name           = "user-groups"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "user_id"
  range_key      = "group_name"

  attribute {
    name = "user_id"
    type = "S"
  }

  attribute {
    name = "group_name"
    type = "S"
  }

  # GSI for querying by group_name
  global_secondary_index {
    name               = "GroupNameIndex"
    hash_key          = "group_name"
    projection_type    = "ALL"
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "contact_information" {
  name           = "contact-information"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "target"
  range_key      = "type"

  attribute {
    name = "target"
    type = "S"
  }

  attribute {
    name = "type"
    type = "S"
  }

  tags = {
    Environment = var.environment
  }
}

# Lambda deployment package
resource "null_resource" "lambda_zip" {
  triggers = {
    lambda_file = filemd5("${path.module}/lambda_function.py")
    requirements = filemd5("${path.module}/requirements.txt")
    build_script = filemd5("${path.module}/build_lambda.sh")
  }

  provisioner "local-exec" {
    command = "bash ${path.module}/build_lambda.sh"
  }
}

data "archive_file" "lambda_zip" {
  depends_on = [null_resource.lambda_zip]
  type        = "zip"
  source_dir  = "${path.module}/package"
  output_path = local.lambda_zip_path
}

# Lambda Function
resource "aws_lambda_function" "directory_service" {
  filename         = local.lambda_zip_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  function_name    = "directory-service"
  role            = aws_iam_role.lambda_role.arn
  handler         = "lambda_function.lambda_handler"
  runtime         = "python3.9"
  timeout         = 30

  environment {
    variables = {
      GROUP_PERMISSIONS_TABLE = aws_dynamodb_table.group_permissions.name
      USER_GROUPS_TABLE      = aws_dynamodb_table.user_groups.name
      CONTACT_INFO_TABLE     = aws_dynamodb_table.contact_information.name
    }
  }

  depends_on = [null_resource.lambda_zip]
}

# API Gateway
# Update the API Gateway REST API resource
resource "aws_api_gateway_rest_api" "directory_service" {
  name        = "directory-service"
  description = "Directory Service API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = "*"
        Action = "execute-api:Invoke"
        Resource = "execute-api:/*"
      }
    ]
  })
}

# API Key
resource "aws_api_gateway_api_key" "directory_service" {
  name = "directory-service-key"
}

resource "aws_api_gateway_usage_plan" "directory_service" {
  name = "directory-service-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.directory_service.id
    stage  = aws_api_gateway_stage.directory_service.stage_name
  }
}

resource "aws_api_gateway_usage_plan_key" "directory_service" {
  key_id        = aws_api_gateway_api_key.directory_service.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.directory_service.id
}

# Deployment and Stage
resource "aws_api_gateway_deployment" "directory_service" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.contacts.id,
      aws_api_gateway_resource.admin_contacts.id,
      aws_api_gateway_resource.docs.id,
      aws_api_gateway_method.contacts_get.id,
      aws_api_gateway_method.admin_contacts_post.id,
      aws_api_gateway_method.admin_contacts_delete.id,
      aws_api_gateway_method.docs_get.id,
      aws_api_gateway_integration.contacts_get.id,
      aws_api_gateway_integration.admin_contacts_post.id,
      aws_api_gateway_integration.admin_contacts_delete.id,
      aws_api_gateway_integration.docs_get.id,
      aws_api_gateway_method.users_get.id,
      aws_api_gateway_integration.users_get.id,
      aws_api_gateway_method.users_options.id,
      aws_api_gateway_integration.users_options.id
    ]))
  }

  depends_on = [
    aws_api_gateway_integration.permissions_get,
    aws_api_gateway_integration.users_get,
    aws_api_gateway_integration.admin_permissions_post,
    aws_api_gateway_integration.admin_permissions_delete,
    aws_api_gateway_integration.admin_users_post,
    aws_api_gateway_integration.admin_users_delete,
    aws_api_gateway_integration.contacts_get,
    aws_api_gateway_integration.admin_contacts_post,
    aws_api_gateway_integration.admin_contacts_delete,
    aws_api_gateway_integration.docs_get
  ]

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage with Logging Configuration
resource "aws_api_gateway_stage" "directory_service" {
  deployment_id = aws_api_gateway_deployment.directory_service.id
  rest_api_id   = aws_api_gateway_rest_api.directory_service.id
  stage_name    = var.environment
  depends_on = [aws_cloudwatch_log_group.directory_service]
}

resource "aws_api_gateway_method_settings" "directory_service" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  stage_name  = aws_api_gateway_stage.directory_service.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled = true
    logging_level   = "INFO"
  }
}

resource "aws_cloudwatch_log_group" "directory_service" {
  name              = "API-Gateway-Execution-Logs_${aws_api_gateway_rest_api.directory_service.id}/${var.environment}"
  retention_in_days = 7
}
