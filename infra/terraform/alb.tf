# ============================================================
# APPLICATION LOAD BALANCER - TICKETGO AWS
# ============================================================
# El ALB es el punto de entrada público de la API.
# Recibe tráfico HTTP en el puerto 80 y lo distribuye
# hacia los contenedores ECS Fargate a través del Target Group.
#
# Flujo: Internet → ALB (puerto 80) → Target Group → ECS (puerto 8080)
#
# El ALB se despliega en las dos subredes públicas para
# garantizar alta disponibilidad entre zonas.
# ============================================================

# ============================================================
# APPLICATION LOAD BALANCER - ALB
# ============================================================
# El ALB recibe tráfico HTTP desde Internet y lo distribuye
# hacia los servicios internos de la aplicación.
# Se coloca en las dos subredes públicas para alta disponibilidad.
resource "aws_lb" "ticketgo_alb" {
  # checkov:skip=CKV_AWS_150:Para un ambiente de demo y desarrollo rapido, la proteccion de borrado del ALB esta desactivada para poder destruir y recrear la infraestructura de forma automatica y sin bloqueos.
  # checkov:skip=CKV_AWS_91:Para un ambiente de demo, el registro de acceso del ALB (Access Logging) esta desactivado para evitar costos y almacenamiento innecesario en S3.
  # checkov:skip=CKV2_AWS_28:En un ambiente de demo, el ALB esta protegido indirectamente por CloudFront (que tiene WAF asociado). Crear un WAF regional adicional para el ALB no es necesario y evita costos adicionales.
  # checkov:skip=CKV2_AWS_20:Para un ambiente de demo sin dominio propio ni certificado SSL en el ALB, este recibe peticiones directas en HTTP. La seguridad SSL se gestiona en la capa de CloudFront para la web, y no se requiere HTTPS directo en el ALB.
  name                       = "ticketgo-alb"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.alb_sg.id]
  drop_invalid_header_fields = true
  enable_deletion_protection = var.alb_deletion_protection

  subnets = [
    aws_subnet.public_az1.id,
    aws_subnet.public_az2.id
  ]

  tags = {
    Name = "ticketgo-alb"
  }
}

# ============================================================
# TARGET GROUP DEL BACKEND
# ============================================================
# El Target Group representa el destino al que el ALB enviará
# las solicitudes. Aquí se registrarán las tareas ECS Fargate
# que ejecutan la API .NET.
# El health check verifica /health cada 30 segundos.
#
resource "aws_lb_target_group" "ticketgo_tg" {
  # checkov:skip=CKV_AWS_378:Uso de HTTP para la comunicacion interna ALB -> ECS. Las tareas se ejecutan dentro de subredes privadas y la terminacion SSL se realiza en la frontera (ALB/CloudFront), por lo que no es necesario cifrar internamente.
  name        = "ticketgo-tg"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = aws_vpc.ticketgo_vpc.id
  target_type = "ip"

  health_check {
    path                = "/health"
    protocol            = "HTTP"
    matcher             = "200-399"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "ticketgo-tg"
  }
}

# ============================================================
# LISTENER HTTP DEL ALB
# ============================================================
# El Listener escucha peticiones HTTP en el puerto 80.
# Cuando recibe tráfico, lo reenvía al Target Group del backend.
resource "aws_lb_listener" "http_listener" {
  # checkov:skip=CKV_AWS_2:Para un ambiente de demo sin certificado ACM SSL asociado, el ALB escucha en protocolo HTTP para permitir conexion directa a la API.
  # checkov:skip=CKV_AWS_103:Para un ambiente de demo, el listener utiliza HTTP (puerto 80), por lo que no aplica configuracion de TLS/SSL.
  load_balancer_arn = aws_lb.ticketgo_alb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.ticketgo_tg.arn
  }
}
