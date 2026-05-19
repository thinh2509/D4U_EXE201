namespace D4U.Api.Infrastructure.Persistence;

using D4U.Api.Application.Common.Data;

public sealed class ConnectionStringProvider(IConfiguration configuration) : IConnectionStringProvider
{
    public string DefaultConnectionString
    {
        get
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection");

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                connectionString = configuration["D4U_DATABASE_CONNECTION"];
            }

            if (string.IsNullOrWhiteSpace(connectionString))
            {
                throw new InvalidOperationException(
                    "Database connection string is not configured. Set ConnectionStrings:DefaultConnection or D4U_DATABASE_CONNECTION.");
            }

            return connectionString;
        }
    }
}
