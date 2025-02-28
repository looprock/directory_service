# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.directory_service.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.directory_service.execution_arn}/*/*"
}

# API Keys
resource "aws_api_gateway_api_key" "public" {
  name = "directory-service-public-key"
}

resource "aws_api_gateway_api_key" "admin" {
  name = "directory-service-admin-key"
}

# Usage Plans
resource "aws_api_gateway_usage_plan" "public" {
  name = "directory-service-public-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.directory_service.id
    stage  = aws_api_gateway_stage.directory_service.stage_name
  }
}

resource "aws_api_gateway_usage_plan" "admin" {
  name = "directory-service-admin-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.directory_service.id
    stage  = aws_api_gateway_stage.directory_service.stage_name
  }
}

# Usage Plan Keys
resource "aws_api_gateway_usage_plan_key" "public" {
  key_id        = aws_api_gateway_api_key.public.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.public.id
}

resource "aws_api_gateway_usage_plan_key" "admin" {
  key_id        = aws_api_gateway_api_key.admin.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.admin.id
}

# Public GET methods
resource "aws_api_gateway_method" "permissions_get" {
  rest_api_id      = aws_api_gateway_rest_api.directory_service.id
  resource_id      = aws_api_gateway_resource.permissions.id
  http_method      = "GET"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "permissions_get" {
  rest_api_id             = aws_api_gateway_rest_api.directory_service.id
  resource_id             = aws_api_gateway_resource.permissions.id
  http_method             = aws_api_gateway_method.permissions_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.directory_service.invoke_arn
  passthrough_behavior    = "WHEN_NO_MATCH"
}

resource "aws_api_gateway_method" "users_get" {
  rest_api_id      = aws_api_gateway_rest_api.directory_service.id
  resource_id      = aws_api_gateway_resource.users.id
  http_method      = "GET"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "users_get" {
  rest_api_id             = aws_api_gateway_rest_api.directory_service.id
  resource_id             = aws_api_gateway_resource.users.id
  http_method             = aws_api_gateway_method.users_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.directory_service.invoke_arn
  passthrough_behavior    = "WHEN_NO_MATCH"
}

# Admin POST methods
resource "aws_api_gateway_method" "admin_permissions_post" {
  rest_api_id      = aws_api_gateway_rest_api.directory_service.id
  resource_id      = aws_api_gateway_resource.admin_permissions.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "admin_permissions_post" {
  rest_api_id             = aws_api_gateway_rest_api.directory_service.id
  resource_id             = aws_api_gateway_resource.admin_permissions.id
  http_method             = aws_api_gateway_method.admin_permissions_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.directory_service.invoke_arn
}

resource "aws_api_gateway_method" "admin_users_post" {
  rest_api_id      = aws_api_gateway_rest_api.directory_service.id
  resource_id      = aws_api_gateway_resource.admin_users.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "admin_users_post" {
  rest_api_id             = aws_api_gateway_rest_api.directory_service.id
  resource_id             = aws_api_gateway_resource.admin_users.id
  http_method             = aws_api_gateway_method.admin_users_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.directory_service.invoke_arn
}

# Admin DELETE methods
resource "aws_api_gateway_method" "admin_permissions_delete" {
  rest_api_id      = aws_api_gateway_rest_api.directory_service.id
  resource_id      = aws_api_gateway_resource.admin_permissions.id
  http_method      = "DELETE"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "admin_permissions_delete" {
  rest_api_id             = aws_api_gateway_rest_api.directory_service.id
  resource_id             = aws_api_gateway_resource.admin_permissions.id
  http_method             = aws_api_gateway_method.admin_permissions_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.directory_service.invoke_arn
}

resource "aws_api_gateway_method" "admin_users_delete" {
  rest_api_id      = aws_api_gateway_rest_api.directory_service.id
  resource_id      = aws_api_gateway_resource.admin_users.id
  http_method      = "DELETE"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "admin_users_delete" {
  rest_api_id             = aws_api_gateway_rest_api.directory_service.id
  resource_id             = aws_api_gateway_resource.admin_users.id
  http_method             = aws_api_gateway_method.admin_users_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.directory_service.invoke_arn
}

# Contact information resources
resource "aws_api_gateway_resource" "contacts" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  parent_id   = aws_api_gateway_resource.v1.id
  path_part   = "contacts"
}

resource "aws_api_gateway_resource" "admin_contacts" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "contacts"
}

# Public GET method for contacts
resource "aws_api_gateway_method" "contacts_get" {
  rest_api_id      = aws_api_gateway_rest_api.directory_service.id
  resource_id      = aws_api_gateway_resource.contacts.id
  http_method      = "GET"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "contacts_get" {
  rest_api_id             = aws_api_gateway_rest_api.directory_service.id
  resource_id             = aws_api_gateway_resource.contacts.id
  http_method             = aws_api_gateway_method.contacts_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.directory_service.invoke_arn
  passthrough_behavior    = "WHEN_NO_MATCH"
}

# Admin POST method for contacts
resource "aws_api_gateway_method" "admin_contacts_post" {
  rest_api_id      = aws_api_gateway_rest_api.directory_service.id
  resource_id      = aws_api_gateway_resource.admin_contacts.id
  http_method      = "POST"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "admin_contacts_post" {
  rest_api_id             = aws_api_gateway_rest_api.directory_service.id
  resource_id             = aws_api_gateway_resource.admin_contacts.id
  http_method             = aws_api_gateway_method.admin_contacts_post.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.directory_service.invoke_arn
}

# Admin DELETE method for contacts
resource "aws_api_gateway_method" "admin_contacts_delete" {
  rest_api_id      = aws_api_gateway_rest_api.directory_service.id
  resource_id      = aws_api_gateway_resource.admin_contacts.id
  http_method      = "DELETE"
  authorization    = "NONE"
  api_key_required = true
}

resource "aws_api_gateway_integration" "admin_contacts_delete" {
  rest_api_id             = aws_api_gateway_rest_api.directory_service.id
  resource_id             = aws_api_gateway_resource.admin_contacts.id
  http_method             = aws_api_gateway_method.admin_contacts_delete.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.directory_service.invoke_arn
}

# Add v1 base path
resource "aws_api_gateway_resource" "v1" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  parent_id   = aws_api_gateway_rest_api.directory_service.root_resource_id
  path_part   = "v1"
}

# Update permissions resource
resource "aws_api_gateway_resource" "permissions" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  parent_id   = aws_api_gateway_resource.v1.id
  path_part   = "permissions"
}

# Update users resource
resource "aws_api_gateway_resource" "users" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  parent_id   = aws_api_gateway_resource.v1.id
  path_part   = "users"
}

# Update admin resource
resource "aws_api_gateway_resource" "admin" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  parent_id   = aws_api_gateway_resource.v1.id
  path_part   = "admin"
}

# Admin permissions resource
resource "aws_api_gateway_resource" "admin_permissions" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "permissions"
}

# Admin users resource
resource "aws_api_gateway_resource" "admin_users" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "users"
}

# Documentation resource
resource "aws_api_gateway_resource" "docs" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  parent_id   = aws_api_gateway_resource.v1.id
  path_part   = "docs"
}

# Documentation GET method
resource "aws_api_gateway_method" "docs_get" {
  rest_api_id      = aws_api_gateway_rest_api.directory_service.id
  resource_id      = aws_api_gateway_resource.docs.id
  http_method      = "GET"
  authorization    = "NONE"
  api_key_required = false
}

# Documentation integration
resource "aws_api_gateway_integration" "docs_get" {
  rest_api_id             = aws_api_gateway_rest_api.directory_service.id
  resource_id             = aws_api_gateway_resource.docs.id
  http_method             = aws_api_gateway_method.docs_get.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.directory_service.invoke_arn
}

# Enable CORS for the API Gateway
resource "aws_api_gateway_resource" "cors" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  parent_id   = aws_api_gateway_rest_api.directory_service.root_resource_id
  path_part   = "{proxy+}"
}

resource "aws_api_gateway_method" "cors" {
  rest_api_id   = aws_api_gateway_rest_api.directory_service.id
  resource_id   = aws_api_gateway_resource.cors.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "cors" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.cors.id
  http_method = aws_api_gateway_method.cors.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "cors" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.cors.id
  http_method = aws_api_gateway_method.cors.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "cors" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.cors.id
  http_method = aws_api_gateway_method.cors.http_method
  status_code = aws_api_gateway_method_response.cors.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Api-Key,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS,POST,PUT,DELETE'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Add OPTIONS method to permissions endpoint
resource "aws_api_gateway_method" "permissions_options" {
  rest_api_id   = aws_api_gateway_rest_api.directory_service.id
  resource_id   = aws_api_gateway_resource.permissions.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "permissions_options" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.permissions.id
  http_method = aws_api_gateway_method.permissions_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "permissions_options" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.permissions.id
  http_method = aws_api_gateway_method.permissions_options.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "permissions_options" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.permissions.id
  http_method = aws_api_gateway_method.permissions_options.http_method
  status_code = aws_api_gateway_method_response.permissions_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Api-Key'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_method_response" "permissions_get" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.permissions.id
  http_method = aws_api_gateway_method.permissions_get.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# Add OPTIONS method to users endpoint
resource "aws_api_gateway_method" "users_options" {
  rest_api_id   = aws_api_gateway_rest_api.directory_service.id
  resource_id   = aws_api_gateway_resource.users.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "users_options" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.users_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "users_options" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.users_options.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "users_options" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.users_options.http_method
  status_code = aws_api_gateway_method_response.users_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Api-Key'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_method_response" "users_get" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.users_get.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "users_get" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.users_get.http_method
  status_code = aws_api_gateway_method_response.users_get.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Api-Key'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Add OPTIONS method to contacts endpoint
resource "aws_api_gateway_method" "contacts_options" {
  rest_api_id   = aws_api_gateway_rest_api.directory_service.id
  resource_id   = aws_api_gateway_resource.contacts.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "contacts_options" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.contacts.id
  http_method = aws_api_gateway_method.contacts_options.http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

resource "aws_api_gateway_method_response" "contacts_options" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.contacts.id
  http_method = aws_api_gateway_method.contacts_options.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "contacts_options" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.contacts.id
  http_method = aws_api_gateway_method.contacts_options.http_method
  status_code = aws_api_gateway_method_response.contacts_options.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Api-Key'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_method_response" "contacts_get" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.contacts.id
  http_method = aws_api_gateway_method.contacts_get.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true,
    "method.response.header.Access-Control-Allow-Methods" = true,
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

resource "aws_api_gateway_integration_response" "contacts_get" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.contacts.id
  http_method = aws_api_gateway_method.contacts_get.http_method
  status_code = aws_api_gateway_method_response.contacts_get.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Api-Key'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_integration_response" "permissions_get" {
  rest_api_id = aws_api_gateway_rest_api.directory_service.id
  resource_id = aws_api_gateway_resource.permissions.id
  http_method = aws_api_gateway_method.permissions_get.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Api-Key'",
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'",
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

resource "aws_api_gateway_account" "directory_service" {
  cloudwatch_role_arn = aws_iam_role.logging_role.arn
  depends_on = [
    aws_iam_role.logging_role
  ]
}