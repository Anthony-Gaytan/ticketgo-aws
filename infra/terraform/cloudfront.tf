# ============================================================
# AMAZON CLOUDFRONT - TICKETGO AWS
# ============================================================
# CDN que distribuye el frontend estático desde S3
# con caché global y HTTPS automático.
#
# Configuración:
#   - Origin: S3 Bucket (vía OAC - Origin Access Control)
#   - Price Class: PriceClass_100 (solo NA y Europa, más barato)
#   - Default Root Object: index.html
#   - Error Pages: SPA routing (403/404 → index.html)
#   - WAF Web ACL asociada para protección
#   - HTTPS: Viewer Protocol Policy redirect-to-https
#
# Costo: Free Tier incluye 1 TB de transferencia al mes.
# ============================================================

# ============================================================
# ORIGIN ACCESS CONTROL (OAC)
# ============================================================
# Permite que CloudFront acceda al bucket S3 de forma segura
# sin necesidad de hacer público el bucket.
resource "aws_cloudfront_origin_access_control" "ticketgo_oac" {
  name                              = "ticketgo-oac"
  description                       = "OAC para acceso seguro de CloudFront a S3"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# ============================================================
# DISTRIBUCIÓN CLOUDFRONT
# ============================================================
# Sirve el frontend React desde S3 con caché global,
# HTTPS automático y protección WAF.
resource "aws_cloudfront_distribution" "ticketgo_cdn" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"
  web_acl_id          = aws_wafv2_web_acl.ticketgo_waf.arn

  # Origen: S3 Bucket del frontend
  origin {
    domain_name              = aws_s3_bucket.ticketgo_frontend.bucket_regional_domain_name
    origin_id                = "S3-ticketgo-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.ticketgo_oac.id
  }

  # Comportamiento por defecto para archivos estáticos
  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD"]
    target_origin_id           = "S3-ticketgo-frontend"
    viewer_protocol_policy     = "redirect-to-https"
    response_headers_policy_id = "67fcdade-6651-4c11-17d0-fd8522635b75" # SecurityHeadersPolicy (AWS Managed)

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # SPA Routing: redirige 403 y 404 a index.html
  # Esto permite que React Router maneje las rutas del lado del cliente
  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  # Restricción geográfica: sin restricciones
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # Certificado SSL por defecto de CloudFront
  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  tags = {
    Name = "ticketgo-cdn"
  }
}
