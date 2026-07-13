import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({ region: process.env.AWS_SES_REGION || "us-east-2" });

export const handler = async (event) => {
  console.log("TicketGo Lambda ejecutada - Iniciando envío por SES");
  console.log("Event:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    try {
      const body = JSON.parse(record.body);
      
      const emailParams = {
        Source: process.env.SES_SENDER_EMAIL,
        Destination: { ToAddresses: [body.email || body.Email] },
        Message: {
          Subject: { Data: `TicketGo - Confirmación de Ticket ${body.ticketId || body.TicketId}` },
          Body: { 
            Text: { 
              Data: `¡Hola ${body.nombre || body.Nombre}!\n\nTu ticket ha sido generado exitosamente.\nID del Ticket: ${body.ticketId || body.TicketId}\n\nGracias por usar TicketGo.` 
            } 
          }
        }
      };

      const command = new SendEmailCommand(emailParams);
      await ses.send(command);
      console.log(`Email enviado exitosamente a: ${body.email || body.Email}`);

    } catch (error) {
      console.error("Error enviando correo o parseando mensaje:", error);
    }
  }

  return {
    statusCode: 200,
    body: "Mensajes procesados y correos enviados correctamente"
  };
};