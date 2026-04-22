# Etapa 1: Construcción
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["cartesWEB.csproj", "./"]
RUN dotnet restore "./cartesWEB.csproj"

COPY . .
RUN dotnet publish "cartesWEB.csproj" -c Release -o /app/publish

# Etapa 2: Ejecución
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Fix SSL para OpenSSL 3 en Linux
RUN sed -i 's/^\(MinProtocol\s*=\s*\).*/\1None/' /etc/ssl/openssl.cnf 2>/dev/null || true && \
    sed -i 's/^\(CipherString\s*=\s*\).*/\1DEFAULT@SECLEVEL=0/' /etc/ssl/openssl.cnf 2>/dev/null || true

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .

ENTRYPOINT ["dotnet", "cartesWEB.dll"]