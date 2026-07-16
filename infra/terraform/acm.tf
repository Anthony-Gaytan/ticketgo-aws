# ============================================================
# AWS ACM - CERTIFICADOS SSL/TLS - TICKETGO AWS
# ============================================================
# Dos certificados gratuitos de AWS Certificate Manager:
#
#   1. cloudfront_cert (us-east-1):
#      - ticketgo-aws.online
#      - www.ticketgo-aws.online
#      Requerido por CloudFront (solo acepta certs en us-east-1)
#
#   2. alb_cert (us-east-2):
#      - api.ticketgo-aws.online
#      Para habilitar HTTPS en el Application Load Balancer
#
# Validación: DNS automática vía Route 53.
# Costo: GRATIS (ACM no tiene cargo).
# ============================================================

# ============================================================
# CERTIFICADO CLOUDFRONT - us-east-1
# ============================================================
# CloudFront SOLO acepta certificados de ACM en us-east-1.
# Cubre el dominio raíz y el subdominio www.
resource "aws_acm_certificate" "cloudfront_cert" {
  count    = var.enable_custom_domain ? 1 : 0
  provider = aws.us_east_1

  domain_name               = var.domain_name
  subject_alternative_names = ["www.${var.domain_name}"]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "ticketgo-cloudfront-cert"
  }
}

# Espera a que ACM valide el certificado de CloudFront
# (requiere que los nameservers de Namecheap ya apunten a Route 53)
resource "aws_acm_certificate_validation" "cloudfront_cert" {
  count    = var.enable_custom_domain ? 1 : 0
  provider = aws.us_east_1

  certificate_arn = aws_acm_certificate.cloudfront_cert[0].arn
  validation_record_fqdns = [
    for record in aws_route53_record.acm_validation_cf : record.fqdn
  ]

  timeouts {
    create = "15m"
  }
}

# ============================================================
# CERTIFICADO ALB - us-east-2
# ============================================================
# Certificado para el ALB en la región principal del proyecto.
# Cubre el subdominio api.ticketgo-aws.online.
resource "aws_acm_certificate" "alb_cert" {
  count = var.enable_custom_domain ? 1 : 0

  domain_name       = "api.${var.domain_name}"
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "ticketgo-alb-cert"
  }
}

# Espera a que ACM valide el certificado del ALB
resource "aws_acm_certificate_validation" "alb_cert" {
  count = var.enable_custom_domain ? 1 : 0

  certificate_arn = aws_acm_certificate.alb_cert[0].arn
  validation_record_fqdns = [
    for record in aws_route53_record.acm_validation_alb : record.fqdn
  ]

  timeouts {
    create = "15m"
  }
}
