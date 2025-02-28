resource "aws_api_gateway_domain_name" "api_domain" {
  count           = var.host_name != "" ? 1 : 0
  domain_name     = var.host_name
  certificate_arn = var.host_cert
}