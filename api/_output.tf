output "api_url" {
  description = "API Gateway URL"
  value       = "${aws_api_gateway_stage.directory_service.invoke_url}"
}

output "public_api_key" {
  description = "API Key for public routes"
  value       = aws_api_gateway_api_key.public.value
  sensitive   = true
}

output "admin_api_key" {
  description = "API Key for admin routes"
  value       = aws_api_gateway_api_key.admin.value
  sensitive   = true
}

output "dynamodb_tables" {
  description = "DynamoDB table names"
  value = {
    group_permissions = aws_dynamodb_table.group_permissions.name
    user_groups      = aws_dynamodb_table.user_groups.name
  }
} 