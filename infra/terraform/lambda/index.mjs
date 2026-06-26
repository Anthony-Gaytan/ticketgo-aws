export const handler = async (event) => {
  console.log("TicketGo Lambda ejecutada");
  console.log("Mensajes recibidos:", JSON.stringify(event, null, 2));

  for (const record of event.Records) {
    console.log("Procesando mensaje SQS:", record.body);
  }

  return {
    statusCode: 200,
    body: "Mensajes procesados correctamente"
  };
};