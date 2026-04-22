# Etapa 1: Construcción (Usa el SDK completo para compilar)
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar el archivo de dependencias y restaurarlas
COPY ["cartesAPI.csproj", "./"]
RUN dotnet restore "./cartesAPI.csproj"

# Copiar el resto del código y compilar la aplicación
COPY . .
RUN dotnet publish "cartesAPI.csproj" -c Release -o /app/publish

# Etapa 2: Ejecución (Usa una imagen más ligera solo para ejecutar)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

# Traer los archivos compilados de la Etapa 1
COPY --from=build /app/publish .

# Comando para arrancar la API
ENTRYPOINT ["dotnet", "cartesAPI.dll"]