variable "environment" {
  description = "Environment name / api gateway stage"
  type        = string
  default     = "global"
}

variable "host_name" {
  description = "custom domain FQDN"
  type        = string
  default     = ""
}

variable "host_cert" {
  description = "arn of certificate to use for custom domain"
  type        = string
  default     = ""
}

variable "host_zone" {
  description = "hosted zone ID of host name"
  type        = string
  default     = ""
}
