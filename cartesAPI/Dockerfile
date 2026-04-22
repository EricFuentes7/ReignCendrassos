# Etapa 1: Construcción
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["cartesAPI.csproj", "./"]
RUN dotnet restore "./cartesAPI.csproj"

COPY . .
RUN dotnet publish "cartesAPI.csproj" -c Release -o /app/publish

# Etapa 2: Ejecución
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Fix SSL para OpenSSL 3 en Linux (necesario para MongoDB Atlas con .NET 10)
RUN sed -i 's/^\(MinProtocol\s*=\s*\).*/\1None/' /etc/ssl/openssl.cnf 2>/dev/null || true && \
    sed -i 's/^\(CipherString\s*=\s*\).*/\1DEFAULT@SECLEVEL=0/' /etc/ssl/openssl.cnf 2>/dev/null || true

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "cartesAPI.dll"]