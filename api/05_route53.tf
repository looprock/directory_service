resource "aws_route53_record" "api_record" {
  count    = var.host_name != "" ? 1 : 0
  zone_id  = var.host_zone
  name     = var.host_name
  type     = "A"
  alias {
    name                   = aws_api_gateway_domain_name.api_domain[0].cloudfront_domain_name
    zone_id                = aws_api_gateway_domain_name.api_domain[0].cloudfront_zone_id
    evaluate_target_health = true
  }
  depends_on = [
    aws_api_gateway_domain_name.api_domain[0]
  ]
}

resource "aws_api_gateway_base_path_mapping" "base_path_mapping" {
  count      = var.host_name != "" ? 1 : 0
  api_id     = aws_api_gateway_rest_api.directory_service.id
  stage_name = aws_api_gateway_stage.directory_service.stage_name
  domain_name = aws_api_gateway_domain_name.api_domain[0].domain_name
  depends_on = [
    aws_api_gateway_rest_api.directory_service,
    aws_api_gateway_domain_name.api_domain[0]
  ]
}
