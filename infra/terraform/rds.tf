# ============================================================
# AMAZON RDS POSTGRESQL - TICKETGO AWS (Fase 4)
# ============================================================
# Base de datos relacional PostgreSQL 16 administrada por AWS.
# Almacena los datos del sistema: usuarios, eventos, tickets,
# órdenes y tipos de entrada.
#
# Configuración planificada:
#   - Engine: PostgreSQL 16
#   - Instance: db.t3.micro (Free Tier elegible)
#   - Storage: 20 GB gp3
#   - Multi-AZ: Controlado por var.rds_multi_az (default: false)
#   - Backup: Retención automática de 7 días
#   - Subnets: private_data_az1, private_data_az2
#   - Security Group: Solo permite tráfico desde ECS (puerto 5432)
#   - Acceso público: Deshabilitado
#
# Costo Single-AZ: ~$13/mes (db.t3.micro)
# Costo Multi-AZ: ~$26/mes (duplica el costo)
# ============================================================
