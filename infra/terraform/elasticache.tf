# ============================================================
# ELASTICACHE REDIS - TICKETGO AWS
# ============================================================
# Clúster de caché en memoria para acelerar la carga del
# catálogo de eventos y otras consultas frecuentes.
#
# Configuración:
#   - Engine: Redis 7.x
#   - Instance: cache.t3.micro (Económico para desarrollo)
#   - Nodes: 1 (Single-AZ para ahorrar costos en demo)
#   - Subnets: private_data_az1, private_data_az2
#   - Security Group: Solo permite tráfico desde ECS (puerto 6379)
# ============================================================

# ============================================================
# ELASTICACHE SUBNET GROUP
# ============================================================
# Define en qué subredes privadas se desplegará el clúster Redis.
# Se reutilizan las subredes privadas de datos (donde está RDS).
resource "aws_elasticache_subnet_group" "ticketgo_redis_subnet_group" {
  name        = "ticketgo-redis-subnet-group"
  description = "Subredes privadas de datos para ElastiCache Redis"
  
  subnet_ids = [
    aws_subnet.private_data_az1.id,
    aws_subnet.private_data_az2.id
  ]
}

# ============================================================
# CLÚSTER ELASTICACHE REDIS
# ============================================================
resource "aws_elasticache_cluster" "ticketgo_redis" {
  cluster_id           = "ticketgo-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  engine_version       = "7.1"
  port                 = 6379

  subnet_group_name    = aws_elasticache_subnet_group.ticketgo_redis_subnet_group.name
  security_group_ids   = [aws_security_group.redis_sg.id]

  # Para reducir tiempo de creación en demo, deshabilitamos snapshot automático
  snapshot_retention_limit = 0

  tags = {
    Name = "ticketgo-redis"
  }
}
