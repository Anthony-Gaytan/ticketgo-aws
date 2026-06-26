# ============================================================
# AWS WAF - TICKETGO AWS (Fase 5)
# ============================================================
# Web Application Firewall que protege CloudFront contra
# ataques comunes (SQL injection, XSS, DDoS básico).
#
# Configuración planificada:
#   - Scope: CLOUDFRONT (requiere us-east-1 para provider)
#   - Rate Limiting: máximo 1000 requests por IP en 5 minutos
#   - AWS Managed Rules: AWSManagedRulesCommonRuleSet
#
# NOTA: WAF para CloudFront debe crearse en us-east-1.
# Se usará un provider alias para esto.
#
# Costo: ~$5/mes (Web ACL) + $1/mes por regla + $0.60/millón requests.
# Para demo con poco tráfico: ~$6-7/mes.
# ============================================================
