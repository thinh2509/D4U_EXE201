FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY D4U.sln ./
COPY D4U.Api/D4U.Api.csproj D4U.Api/
RUN dotnet restore D4U.sln
COPY . .
RUN dotnet publish D4U.Api/D4U.Api.csproj -c Release -o /app/publish --no-restore

FROM runtime AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "D4U.Api.dll"]
