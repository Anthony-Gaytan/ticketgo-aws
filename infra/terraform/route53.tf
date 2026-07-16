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
# DNSSEC - FIRMA DE LA ZONA PÚBLICA
# ============================================================
# Route 53 exige una clave KMS asimétrica ECC_NIST_P256 en
# us-east-1 para crear la Key Signing Key (KSK) de DNSSEC.
resource "aws_kms_key" "route53_dnssec" {
  count    = var.enable_custom_domain ? 1 : 0
  provider = aws.us_east_1

  # checkov:skip=CKV_AWS_7:AWS KMS no admite rotación automática para claves asimétricas SIGN_VERIFY utilizadas por Route 53 DNSSEC.
  description              = "Clave KMS para DNSSEC de ${var.domain_name}"
  customer_master_key_spec = "ECC_NIST_P256"
  key_usage                = "SIGN_VERIFY"
  deletion_window_in_days  = 7

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "EnableAccountAdministration"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${var.aws_account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "AllowRoute53DNSSECService"
        Effect = "Allow"
        Principal = {
          Service = "dnssec-route53.amazonaws.com"
        }
        Action = [
          "kms:DescribeKey",
          "kms:GetPublicKey",
          "kms:Sign"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "aws:SourceAccount" = var.aws_account_id
          }
          ArnLike = {
            "aws:SourceArn" = "arn:aws:route53:::hostedzone/*"
          }
        }
      }
    ]
  })

  tags = {
    Name = "ticketgo-route53-dnssec"
  }
}

resource "aws_kms_alias" "route53_dnssec" {
  count    = var.enable_custom_domain ? 1 : 0
  provider = aws.us_east_1

  name          = "alias/ticketgo-route53-dnssec"
  target_key_id = aws_kms_key.route53_dnssec[0].key_id
}

resource "aws_route53_key_signing_key" "ticketgo" {
  count = var.enable_custom_domain ? 1 : 0

  hosted_zone_id             = aws_route53_zone.ticketgo_zone[0].id
  key_management_service_arn = aws_kms_key.route53_dnssec[0].arn
  name                       = "ticketgo"
  status                     = "ACTIVE"
}

resource "aws_route53_hosted_zone_dnssec" "ticketgo" {
  count = var.enable_custom_domain ? 1 : 0

  hosted_zone_id = aws_route53_zone.ticketgo_zone[0].id

  depends_on = [aws_route53_key_signing_key.ticketgo]
}

# ============================================================
# ROUTE 53 QUERY LOGGING
# ============================================================
# Los logs de consultas de zonas públicas deben almacenarse en
# un Log Group de CloudWatch ubicado en us-east-1.
resource "aws_cloudwatch_log_group" "route53_queries" {
  count    = var.enable_custom_domain ? 1 : 0
  provider = aws.us_east_1

  # checkov:skip=CKV_AWS_158:El cifrado KMS de este Log Group global se difiere para evitar una segunda clave simétrica dedicada en us-east-1 en el ambiente académico.
  name              = "/aws/route53/${var.domain_name}"
  retention_in_days = 365

  tags = {
    Name = "ticketgo-route53-query-logs"
  }
}

data "aws_iam_policy_document" "route53_query_logging" {
  count    = var.enable_custom_domain ? 1 : 0
  provider = aws.us_east_1

  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["route53.amazonaws.com"]
    }

    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]

    resources = ["${aws_cloudwatch_log_group.route53_queries[0].arn}:log-stream:*"]
  }
}

resource "aws_cloudwatch_log_resource_policy" "route53_query_logging" {
  count    = var.enable_custom_domain ? 1 : 0
  provider = aws.us_east_1

  policy_name     = "ticketgo-route53-query-logging"
  policy_document = data.aws_iam_policy_document.route53_query_logging[0].json
}

resource "aws_route53_query_log" "ticketgo" {
  count = var.enable_custom_domain ? 1 : 0

  zone_id                  = aws_route53_zone.ticketgo_zone[0].zone_id
  cloudwatch_log_group_arn = aws_cloudwatch_log_group.route53_queries[0].arn

  depends_on = [aws_cloudwatch_log_resource_policy.route53_query_logging]
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
