# Docker Desktop Guide for D4U MVP

This guide explains how to run the D4U MVP backend and PostgreSQL database with Docker Desktop.

## What Docker Runs

The project uses `docker-compose.yml` to start two containers:

- `d4u-postgres`: PostgreSQL 16 database.
- `d4u-api`: ASP.NET Core .NET 8 Web API.

The API container connects to PostgreSQL through Docker's internal network using the service name `postgres`.

## Prerequisites

- Docker Desktop installed and running.
- Docker Desktop uses Linux containers.
- Git repository cloned locally.
- Port `8080` available for the API.
- Port `5432` available for PostgreSQL, unless changed in `.env`.

Check Docker from PowerShell:

```powershell
docker --version
docker compose version
```

## First-Time Setup

Open PowerShell at the project root:

```powershell
cd D:\Codex
```

Create a local environment file:

```powershell
copy .env.example .env
```

Open `.env` and change the database password:

```env
POSTGRES_DB=d4u_mvp
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_strong_password
POSTGRES_PORT=5432
D4U_API_PORT=8080
```

Do not commit `.env`. It is ignored by Git.

## Start the Project

Run:

```powershell
docker compose up -d --build
```

This command:

- Pulls the PostgreSQL image if needed.
- Builds the ASP.NET Core API image.
- Starts PostgreSQL.
- Waits for PostgreSQL to become healthy.
- Starts the API.
- Applies EF Core migrations automatically because `D4U_APPLY_MIGRATIONS=true`.

## Open the API

Swagger:

```text
http://localhost:8080/swagger
```

Health check:

```text
http://localhost:8080/health
```

Expected health response:

```json
{
  "status": "ok",
  "service": "D4U.Api"
}
```

## View Container Status

```powershell
docker compose ps
```

Expected services:

- `d4u-postgres`
- `d4u-api`

## View Logs

API logs:

```powershell
docker compose logs -f api
```

PostgreSQL logs:

```powershell
docker compose logs -f postgres
```

All logs:

```powershell
docker compose logs -f
```

## Connect to PostgreSQL

From the host machine, connect with:

```text
Host: localhost
Port: 5432
Database: d4u_mvp
Username: postgres
Password: value from .env
```

If you changed `POSTGRES_PORT`, use that port instead.

From inside Docker, the API uses:

```text
Host=postgres;Port=5432;Database=d4u_mvp;Username=postgres;Password=<POSTGRES_PASSWORD>
```

## Frontend From Another Machine

If another machine on the same LAN needs to call the API:

1. Find the LAN IP of the machine running Docker:

```powershell
ipconfig
```

2. Use the IPv4 address, for example:

```text
192.168.1.10
```

3. The frontend should call:

```text
http://192.168.1.10:8080
```

4. If the request is blocked, allow inbound TCP traffic on port `8080` in Windows Firewall.

PowerShell as Administrator:

```powershell
New-NetFirewallRule -DisplayName "D4U API 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
```

## Stop the Project

Stop containers but keep database data:

```powershell
docker compose down
```

Start again:

```powershell
docker compose up -d
```

## Reset the Docker Database

This deletes the PostgreSQL Docker volume and all local Docker database data:

```powershell
docker compose down -v
docker compose up -d --build
```

Use this only when you want a clean database.

## Rebuild the API Image

After code changes:

```powershell
docker compose up -d --build api
```

Or rebuild everything:

```powershell
docker compose up -d --build
```

## Common Issues

### Docker command not found

Docker Desktop is not installed, not running, or not available in `PATH`.

Fix:

- Open Docker Desktop.
- Wait until Docker says it is running.
- Close and reopen PowerShell.
- Run `docker --version` again.

### Port is already allocated

Another process is using port `8080` or `5432`.

Fix by changing `.env`:

```env
POSTGRES_PORT=5433
D4U_API_PORT=8081
```

Then run:

```powershell
docker compose up -d
```

### API cannot connect to PostgreSQL

Check container status:

```powershell
docker compose ps
```

Check logs:

```powershell
docker compose logs -f api
docker compose logs -f postgres
```

Common causes:

- `.env` is missing.
- `POSTGRES_PASSWORD` was changed after the volume was already created.
- PostgreSQL volume still uses old credentials.

If this is a local dev database and you can delete it:

```powershell
docker compose down -v
docker compose up -d --build
```

### Frontend cannot call API from another machine

Check:

- Both machines are on the same network.
- API is reachable at `http://<host-lan-ip>:8080/health`.
- Windows Firewall allows port `8080`.
- Backend CORS policy allows the frontend origin.

## Useful Commands

```powershell
docker compose up -d --build
docker compose ps
docker compose logs -f api
docker compose logs -f postgres
docker compose down
docker compose down -v
docker compose pull
docker compose build --no-cache
```
