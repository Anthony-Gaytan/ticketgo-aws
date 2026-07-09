# ============================================================
# RED - TICKETGO AWS
# ============================================================
# Contiene la VPC principal, subredes públicas y privadas,
# Internet Gateway y tablas de rutas.
# Diseño de 3 capas:
#   - Pública:      ALB (10.0.1.0/24, 10.0.2.0/24)
#   - Privada App:  ECS Fargate (10.0.11.0/24, 10.0.12.0/24)
#   - Privada Data: RDS PostgreSQL (10.0.21.0/24, 10.0.22.0/24)
# Cada capa tiene 2 subredes en AZ distintas para alta disponibilidad.
# ============================================================

# ============================================================
# ZONAS DE DISPONIBILIDAD DE LA REGIÓN
# ============================================================
# Terraform obtiene automáticamente las zonas disponibles
# en la región configurada, en este caso us-east-2.
# Se utilizarán al menos dos zonas para alta disponibilidad.
data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================================
# VPC PRINCIPAL DEL PROYECTO TICKETGO
# ============================================================
# La VPC es la red privada principal donde se desplegarán
# los recursos de backend, base de datos, balanceador y servicios internos.
# CIDR 10.0.0.0/16 permite crear varias subredes dentro de esta red.
resource "aws_vpc" "ticketgo_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "ticketgo-vpc"
  }
}

# ============================================================
# SUBRED PÚBLICA EN AZ-1
# ============================================================
# Esta subred estará en la primera zona de disponibilidad.
# Se usará para componentes públicos como el Application Load Balancer.
# map_public_ip_on_launch permite asignar IP pública a recursos que lo requieran.
#
resource "aws_subnet" "public_az1" {
  # checkov:skip=CKV_AWS_130:Las subredes publicas necesitan asignar IP publica automaticamente por diseño, ya que en ellas se alojan recursos de cara a Internet como el ALB.
  vpc_id                  = aws_vpc.ticketgo_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = data.aws_availability_zones.available.names[0]
  map_public_ip_on_launch = true

  tags = {
    Name = "ticketgo-public-az1"
  }
}

# ============================================================
# SUBRED PÚBLICA EN AZ-2
# ============================================================
# Segunda subred pública ubicada en otra zona de disponibilidad.
# Permite que el balanceador tenga alta disponibilidad entre AZ-1 y AZ-2.
resource "aws_subnet" "public_az2" {
  # checkov:skip=CKV_AWS_130:Las subredes publicas necesitan asignar IP publica automaticamente por diseño, ya que en ellas se alojan recursos de cara a Internet como el ALB.
  vpc_id                  = aws_vpc.ticketgo_vpc.id
  cidr_block              = "10.0.2.0/24"
  availability_zone       = data.aws_availability_zones.available.names[1]
  map_public_ip_on_launch = true

  tags = {
    Name = "ticketgo-public-az2"
  }
}

# ============================================================
# INTERNET GATEWAY
# ============================================================
# Permite que la VPC tenga comunicación con Internet.
# Es necesario para que los recursos públicos, como el ALB,
# puedan recibir tráfico desde usuarios externos.
resource "aws_internet_gateway" "ticketgo_igw" {
  vpc_id = aws_vpc.ticketgo_vpc.id

  tags = {
    Name = "ticketgo-igw"
  }
}

# ============================================================
# TABLA DE RUTAS PÚBLICA
# ============================================================
# Define la ruta de salida hacia Internet.
# La regla 0.0.0.0/0 significa "todo tráfico externo".
# Ese tráfico se envía al Internet Gateway.
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.ticketgo_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.ticketgo_igw.id
  }

  tags = {
    Name = "ticketgo-public-rt"
  }
}

# ============================================================
# ASOCIACIÓN DE SUBRED PÚBLICA AZ-1 CON TABLA DE RUTAS
# ============================================================
# Conecta la subred pública AZ-1 con la tabla de rutas pública.
# Esto permite que esa subred use el Internet Gateway.
resource "aws_route_table_association" "public_az1" {
  subnet_id      = aws_subnet.public_az1.id
  route_table_id = aws_route_table.public_rt.id
}

# ============================================================
# ASOCIACIÓN DE SUBRED PÚBLICA AZ-2 CON TABLA DE RUTAS
# ============================================================
# Conecta la subred pública AZ-2 con la tabla de rutas pública.
# Así ambas subredes públicas quedan preparadas para alojar el ALB.
resource "aws_route_table_association" "public_az2" {
  subnet_id      = aws_subnet.public_az2.id
  route_table_id = aws_route_table.public_rt.id
}

# ============================================================
# ELASTIC IPs Y NAT GATEWAYS
# ============================================================
# Requeridos para que los contenedores ECS en subredes privadas
# puedan salir a Internet a descargar las imágenes de ECR.
# Habilita el tráfico saliente mientras bloquea el entrante.
resource "aws_eip" "nat_az1" {
  domain = "vpc"
  tags = {
    Name = "ticketgo-eip-nat-az1"
  }
}

resource "aws_nat_gateway" "nat_az1" {
  allocation_id = aws_eip.nat_az1.id
  subnet_id     = aws_subnet.public_az1.id

  tags = {
    Name = "ticketgo-nat-az1"
  }
  depends_on = [aws_internet_gateway.ticketgo_igw]
}

resource "aws_eip" "nat_az2" {
  domain = "vpc"
  tags = {
    Name = "ticketgo-eip-nat-az2"
  }
}

resource "aws_nat_gateway" "nat_az2" {
  allocation_id = aws_eip.nat_az2.id
  subnet_id     = aws_subnet.public_az2.id

  tags = {
    Name = "ticketgo-nat-az2"
  }
  depends_on = [aws_internet_gateway.ticketgo_igw]
}

# ============================================================
# TABLAS DE RUTAS PRIVADAS (APP)
# ============================================================
# Enrutan el tráfico de salida de las subredes privadas de app
# hacia los NAT Gateways de su respectiva zona.
resource "aws_route_table" "private_app_rt_az1" {
  vpc_id = aws_vpc.ticketgo_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_az1.id
  }

  tags = {
    Name = "ticketgo-private-app-rt-az1"
  }
}

resource "aws_route_table" "private_app_rt_az2" {
  vpc_id = aws_vpc.ticketgo_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_az2.id
  }

  tags = {
    Name = "ticketgo-private-app-rt-az2"
  }
}

# ============================================================
# ASOCIACIONES DE TABLAS DE RUTAS PRIVADAS
# ============================================================
resource "aws_route_table_association" "private_app_az1" {
  subnet_id      = aws_subnet.private_app_az1.id
  route_table_id = aws_route_table.private_app_rt_az1.id
}

resource "aws_route_table_association" "private_app_az2" {
  subnet_id      = aws_subnet.private_app_az2.id
  route_table_id = aws_route_table.private_app_rt_az2.id
}

# ============================================================
# SUBRED PRIVADA DE APLICACIÓN EN AZ-1
# ============================================================
# Esta subred alojará los contenedores ECS Fargate del backend.
# No tendrá acceso directo desde Internet ni IP pública.
# Solo recibirá tráfico proveniente del Application Load Balancer.
resource "aws_subnet" "private_app_az1" {
  vpc_id            = aws_vpc.ticketgo_vpc.id
  cidr_block        = "10.0.11.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "ticketgo-private-app-az1"
  }
}

# ============================================================
# SUBRED PRIVADA DE APLICACIÓN EN AZ-2
# ============================================================
# Segunda subred privada para garantizar alta disponibilidad.
# ECS Fargate desplegará tareas en ambas zonas de disponibilidad.
# Al no tener IP pública, incrementa la seguridad del backend.
resource "aws_subnet" "private_app_az2" {
  vpc_id            = aws_vpc.ticketgo_vpc.id
  cidr_block        = "10.0.12.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "ticketgo-private-app-az2"
  }
}

# ============================================================
# SUBRED PRIVADA DE DATOS EN AZ-1
# ============================================================
# Esta subred alojará recursos de datos como RDS PostgreSQL.
# No tendrá IP pública ni acceso directo desde Internet.
# Solo será accedida desde la capa de aplicación, es decir, ECS Fargate.
resource "aws_subnet" "private_data_az1" {
  vpc_id            = aws_vpc.ticketgo_vpc.id
  cidr_block        = "10.0.21.0/24"
  availability_zone = data.aws_availability_zones.available.names[0]

  tags = {
    Name = "ticketgo-private-data-az1"
  }
}

# ============================================================
# SUBRED PRIVADA DE DATOS EN AZ-2
# ============================================================
# Segunda subred privada de datos para alta disponibilidad.
# Permitirá desplegar servicios como RDS Multi-AZ o Redis en más de una zona.
resource "aws_subnet" "private_data_az2" {
  vpc_id            = aws_vpc.ticketgo_vpc.id
  cidr_block        = "10.0.22.0/24"
  availability_zone = data.aws_availability_zones.available.names[1]

  tags = {
    Name = "ticketgo-private-data-az2"
  }
}

# ============================================================
# SECURITY GROUP PREDETERMINADO DE LA VPC (DEFAULT SG)
# ============================================================
# Checkov exige que el Security Group predeterminado de toda VPC
# restrinja todo tráfico entrante y saliente.
# Adoptar este recurso de forma "vacía" deshabilita todas las reglas
# implícitas de entrada/salida que AWS asocia por defecto.
resource "aws_default_security_group" "default" {
  vpc_id = aws_vpc.ticketgo_vpc.id
  # Dejar sin ingress/egress blocks para bloquear todo el tráfico.
}

# ============================================================
# CLOUDWATCH LOG GROUP PARA VPC FLOW LOGS
# ============================================================
# Registra todo el tráfico de red de la VPC para auditoría y seguridad.
resource "aws_cloudwatch_log_group" "vpc_flow_log_group" {
  # checkov:skip=CKV_AWS_158:Para un ambiente de demo, el cifrado con KMS de los Log Groups de CloudWatch esta desactivado para evitar costos innecesarios de KMS ($1/mes por clave mas costos de llamadas).
  # checkov:skip=CKV_AWS_338:Para un ambiente de demo, la retencion de logs es de 7 dias (definido por var.log_retention_days) para optimizar costos de almacenamiento en CloudWatch, lo cual es suficiente para pruebas y desarrollo.
  name              = "/aws/vpc-flow-logs/ticketgo"
  retention_in_days = var.log_retention_days

  tags = {
    Name = "ticketgo-vpc-flow-logs"
  }
}

# ============================================================
# IAM ROLE Y POLÍTICA PARA VPC FLOW LOGS
# ============================================================
# Otorga permisos al servicio Flow Logs para crear streams y
# enviar registros de logs hacia el Log Group de CloudWatch.
resource "aws_iam_role" "vpc_flow_log_role" {
  name = "ticketgo-vpc-flow-log-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Name = "ticketgo-vpc-flow-log-role"
  }
}

resource "aws_iam_role_policy" "vpc_flow_log_policy" {
  name = "ticketgo-vpc-flow-log-policy"
  role = aws_iam_role.vpc_flow_log_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.vpc_flow_log_group.arn}:*"
      }
    ]
  })
}

# ============================================================
# VPC FLOW LOG RESOURCE
# ============================================================
# Habilita el registro de flujos IP aceptados/rechazados en la VPC.
# Resuelve CKV2_AWS_11.
resource "aws_flow_log" "ticketgo_vpc_flow_log" {
  iam_role_arn    = aws_iam_role.vpc_flow_log_role.arn
  log_destination = aws_cloudwatch_log_group.vpc_flow_log_group.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.ticketgo_vpc.id

  tags = {
    Name = "ticketgo-vpc-flow-log"
  }
}
