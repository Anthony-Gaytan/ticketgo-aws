# ============================================================
# AMAZON ROUTE 53 - TICKETGO AWS
# ============================================================
# DNS público para el dominio ticketgo-aws.online
#
# Registros creados:
#   ticketgo-aws.online       → CloudFront (frontend)
#   www.ticketgo-aws.online   → CloudFront (frontend)
#   api.ticketgo-aws.online   → ALB (backend API)
#
# IMPORTANTE (PASO MANUAL - SOLO UNA VEZ):
# Después del primer terraform apply, ejecuta:
#   terraform output route53_nameservers
# y configura esos 4 nameservers en Namecheap:
#   Domain List → ticketgo-aws.online → Nameservers
#   → Custom DNS → pegar los 4 nameservers de AWS
#
# La propagación DNS tarda entre 5 minutos y 48 horas.
# Los certificados ACM se validan automáticamente una vez
# que los nameservers propaguen.
# ============================================================

# ============================================================
# HOSTED ZONE
# ============================================================
# Zona DNS pública en Route 53 para el dominio.
resource "aws_route53_zone" "ticketgo_zone" {
  count = var.enable_custom_domain ? 1 : 0
  name  = var.domain_name

  tags = {
    Name = "ticketgo-zone"
  }
}

# ============================================================
# REGISTRO A - DOMINIO RAÍZ → CLOUDFRONT
# ============================================================
# ticketgo-aws.online → CloudFront distribution
resource "aws_route53_record" "root_a" {
  count   = var.enable_custom_domain && var.enable_cloudfront ? 1 : 0
  zone_id = aws_route53_zone.ticketgo_zone[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.ticketgo_cdn[0].domain_name
    zone_id                = aws_cloudfront_distribution.ticketgo_cdn[0].hosted_zone_id
    evaluate_target_health = false
  }
}

# ============================================================
# REGISTRO A - WWW → CLOUDFRONT
# ============================================================
# www.ticketgo-aws.online → CloudFront distribution
resource "aws_route53_record" "www_a" {
  count   = var.enable_custom_domain && var.enable_cloudfront ? 1 : 0
  zone_id = aws_route53_zone.ticketgo_zone[0].zone_id
  name    = "www.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.ticketgo_cdn[0].domain_name
    zone_id                = aws_cloudfront_distribution.ticketgo_cdn[0].hosted_zone_id
    evaluate_target_health = false
  }
}

# ============================================================
# REGISTRO A - API → ALB
# ============================================================
# api.ticketgo-aws.online → Application Load Balancer
resource "aws_route53_record" "api_a" {
  count   = var.enable_custom_domain ? 1 : 0
  zone_id = aws_route53_zone.ticketgo_zone[0].zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.ticketgo_alb.dns_name
    zone_id                = aws_lb.ticketgo_alb.zone_id
    evaluate_target_health = true
  }
}

# ============================================================
# VALIDACIÓN DNS - CERTIFICADO CLOUDFRONT (us-east-1)
# ============================================================
# Route 53 crea los registros CNAME necesarios para que ACM
# valide automáticamente la propiedad del dominio.
resource "aws_route53_record" "acm_validation_cf" {
  for_each = var.enable_custom_domain ? {
    for dvo in aws_acm_certificate.cloudfront_cert[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  zone_id         = aws_route53_zone.ticketgo_zone[0].zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

# ============================================================
# VALIDACIÓN DNS - CERTIFICADO ALB (us-east-2)
# ============================================================
resource "aws_route53_record" "acm_validation_alb" {
  for_each = var.enable_custom_domain ? {
    for dvo in aws_acm_certificate.alb_cert[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  zone_id         = aws_route53_zone.ticketgo_zone[0].zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}
