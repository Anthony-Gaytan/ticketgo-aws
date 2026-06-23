# ============================================================
# VPC PRINCIPAL DEL PROYECTO TICKETGO
# ============================================================
# La VPC es la red privada principal donde se desplegarán
# los recursos de backend, base de datos, balanceador y servicios internos.
# CIDR 10.0.0.0/16 permite crear varias subredes dentro de esta red.
resource "aws_vpc" "ticketgo_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "ticketgo-vpc"
  }
}

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
# SUBRED PÚBLICA EN AZ-1
# ============================================================
# Esta subred estará en la primera zona de disponibilidad.
# Se usará para componentes públicos como el Application Load Balancer.
# map_public_ip_on_launch permite asignar IP pública a recursos que lo requieran.
resource "aws_subnet" "public_az1" {
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
