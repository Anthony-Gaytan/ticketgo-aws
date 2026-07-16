# Preparacion del despliegue de produccion

Esta configuracion prepara TicketGo para desplegarse en la cuenta AWS `783111403254`. Crear el archivo y fusionar sus cambios no despliega recursos: el workflow `Terraform Plan and Apply` solo se inicia manualmente.

## Controles obligatorios

- GitHub Environment `production` con al menos un revisor requerido.
- Secret de repositorio `AWS_ROLE_ARN` con el rol OIDC de la cuenta compartida.
- Secret de repositorio `SES_EMAIL_IDENTITY` con una identidad controlada por el equipo.
- Dominio `ticketgo-aws.online` bajo control del equipo y nameservers delegados a Route 53.
- Cuenta SES fuera del sandbox antes de enviar correos a destinatarios no verificados.
- Valores reales disponibles en Secrets Manager para la conexion de PostgreSQL y la firma JWT.
- Imagen `ticketgo-api:latest` disponible en ECR antes de iniciar dos tareas ECS.

## Perfil Terraform

El workflow utiliza explicitamente:

```text
infra/terraform/environments/production.tfvars
```

Este perfil habilita CloudFront, WAF, Route 53, certificados ACM, RDS Multi-AZ, backups, protecciones de borrado, dos tareas ECS y Auto Scaling. Tambien desactiva las migraciones automaticas durante el arranque de los contenedores.

## Secuencia futura de despliegue

1. Ejecutar las validaciones del Pull Request.
2. Crear el Environment `production` y configurar sus aprobadores.
3. Configurar los Secrets de GitHub y los valores de Secrets Manager.
4. Aprovisionar primero ECR y dependencias base sin iniciar la API.
5. Construir y publicar la imagen del backend.
6. Generar Terraform Plan con el perfil de produccion.
7. Revisar sustituciones, eliminaciones y costos antes de aprobar.
8. Aplicar exactamente el plan revisado.
9. Ejecutar migraciones como una tarea ECS independiente.
10. Desplegar frontend y backend, ejecutar pruebas de humo y comprobar alarmas.

## Estado actual

La configuracion esta preparada, pero no autoriza ni ejecuta un despliegue. SQS, Lambda, SES y Redis deben validarse funcionalmente antes de considerar completa la salida a produccion.
