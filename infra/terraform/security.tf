# ============================================================
# SECURITY GROUPS - TICKETGO AWS
# ============================================================
# Define los grupos de seguridad que controlan el tráfico
# de red hacia cada capa de la arquitectura.
# Principio de mínimo privilegio: cada capa solo permite
# tráfico desde la capa anterior.
#
# Internet → ALB SG (puerto 80) → ECS SG (puerto 8080)
#                                    ↓
#                              RDS SG (puerto 5432) [Fase 4]
# ============================================================

# ============================================================
# SECURITY GROUP DEL APPLICATION LOAD BALANCER
# ============================================================
# Este grupo de seguridad permite que el ALB reciba tráfico HTTP
# desde Internet. Más adelante, cuando usemos dominio y certificado,
# también se podrá habilitar HTTPS.
resource "aws_security_group" "alb_sg" {
  name        = "ticketgo-alb-sg"
  description = "Permite trafico HTTP publico hacia el ALB"
  vpc_id      = aws_vpc.ticketgo_vpc.id

  ingress {
    description = "HTTP desde Internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Salida permitida hacia cualquier destino"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ticketgo-alb-sg"
  }
}

# ============================================================
# SECURITY GROUP DE ECS FARGATE
# ============================================================
# Este grupo de seguridad protege los contenedores del backend.
# Solo permite tráfico desde el Security Group del ALB.
# Es decir, Internet no puede acceder directamente a ECS.
resource "aws_security_group" "ecs_sg" {
  name        = "ticketgo-ecs-sg"
  description = "Permite trafico hacia ECS solo desde el ALB"
  vpc_id      = aws_vpc.ticketgo_vpc.id

  ingress {
    description     = "HTTP desde ALB hacia ECS"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    description = "Salida permitida hacia cualquier destino"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ticketgo-ecs-sg"
  }
}

# ============================================================
# SECURITY GROUP DE RDS POSTGRESQL
# ============================================================
# Este grupo de seguridad protege la base de datos.
# Solo permite conexiones PostgreSQL (puerto 5432) desde ECS Fargate.
resource "aws_security_group" "rds_sg" {
  name        = "ticketgo-rds-sg"
  description = "Permite trafico PostgreSQL solo desde ECS"
  vpc_id      = aws_vpc.ticketgo_vpc.id

  ingress {
    description     = "PostgreSQL desde ECS"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_sg.id]
  }

  egress {
    description = "Salida permitida hacia cualquier destino"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ticketgo-rds-sg"
  }
}
