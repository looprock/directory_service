# Lambda execution role
resource "aws_iam_role" "lambda_role" {
  name = "directory-service-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# DynamoDB access policy
resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "directory-service-dynamodb-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.group_permissions.arn,
          aws_dynamodb_table.user_groups.arn,
          aws_dynamodb_table.contact_information.arn,
          "${aws_dynamodb_table.group_permissions.arn}/index/*",
          "${aws_dynamodb_table.user_groups.arn}/index/*"
        ]
      }
    ]
  })
}

# New logging role
resource "aws_iam_role" "logging_role" {
  name = "directory-service-logging-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })
}

# Logging policy attachment
resource "aws_iam_role_policy" "logging_policy" {
  name = "directory-service-logging-policy"
  role = aws_iam_role.logging_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams",
          "logs:PutLogEvents",
          "logs:GetLogEvents",
          "logs:FilterLogEvents",
          "apigateway:POST"
        ]
        Resource = [
          "arn:aws:logs:*:*:log-group:API-Gateway-Execution-Logs_*:${var.environment}"
        ]
      }
    ]
  })
}

# API Gateway cloudwatch logging attachement
resource "aws_iam_role_policy_attachment" "push_to_cloudwatch" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
  role       = aws_iam_role.logging_role.name
}