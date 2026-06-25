# ============================================================
# ETAPA 1 - COMPILACIÓN
# ============================================================
# Utilizamos la imagen oficial SDK de .NET 8 para compilar
# el proyecto y generar los archivos publicados.
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /src

# Copiamos el archivo del proyecto
COPY *.csproj .

# Restauramos dependencias
RUN dotnet restore

# Copiamos el resto del código fuente
COPY . .

# Publicamos la aplicación
RUN dotnet publish -c Release -o /app/publish

# ============================================================
# ETAPA 2 - RUNTIME
# ============================================================
# Imagen más liviana para ejecutar la aplicación
FROM mcr.microsoft.com/dotnet/aspnet:8.0

WORKDIR /app

# Copiamos el resultado compilado
COPY --from=build /app/publish .

# Puerto que utilizará la API dentro del contenedor
EXPOSE 8080

# Configuración para ASP.NET
ENV ASPNETCORE_URLS=http://+:8080

# Punto de entrada
ENTRYPOINT ["dotnet", "TicketGo.Api.dll"]