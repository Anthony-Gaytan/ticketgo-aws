# ============================================================
# AWS WAF - TICKETGO AWS
# ============================================================
# Web Application Firewall que protege CloudFront contra
# ataques comunes (SQL injection, XSS, DDoS básico).
#
# Configuración:
#   - Scope: CLOUDFRONT (requiere us-east-1 para provider)
#   - Rate Limiting: máximo 1000 requests por IP en 5 minutos
#   - AWS Managed Rules: AWSManagedRulesCommonRuleSet
#
# Costo: ~$5/mes (Web ACL) + $1/mes por regla + $0.60/millón requests.
# Para demo con poco tráfico: ~$6-7/mes.
# ============================================================

# ============================================================
# WAF WEB ACL - PROTECCIÓN DE CLOUDFRONT
# ============================================================
# Protege el CDN con rate limiting y reglas administradas
# por AWS contra los ataques más comunes del OWASP Top 10.
resource "aws_wafv2_web_acl" "ticketgo_waf" {
  # checkov:skip=CKV2_AWS_31:Para un ambiente de demo, el registro de logs detallado de WAFv2 (Logging Configuration) esta desactivado para evitar altos costos de transferencia y almacenamiento de logs de peticiones HTTP en CloudWatch.
  count    = var.enable_waf ? 1 : 0
  provider = aws.us_east_1
  name     = "ticketgo-waf"
  scope    = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Rate limiting: máximo 1000 requests por IP en 5 minutos
  rule {
    name     = "rate-limit"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 1000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name                = "ticketgo-rate-limit"
    }
  }

  # AWS Managed Rules - protección contra ataques comunes
  rule {
    name     = "aws-managed-common"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"
      }
    }

    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name                = "ticketgo-aws-common-rules"
    }
  }

  # AWS Managed Rules - Known bad inputs (Log4j vulnerability protection, etc.)
  rule {
    name     = "aws-managed-known-bad-inputs"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    visibility_config {
      sampled_requests_enabled   = true
      cloudwatch_metrics_enabled = true
      metric_name                = "ticketgo-aws-known-bad-inputs"
    }
  }

  visibility_config {
    sampled_requests_enabled   = true
    cloudwatch_metrics_enabled = true
    metric_name                = "ticketgo-waf"
  }

  tags = {
    Name = "ticketgo-waf"
  }
}
