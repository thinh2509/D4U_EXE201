namespace D4U.Api.Infrastructure.Persistence;

using System.Data.Common;
using D4U.Api.Application.Common.Data;
using Npgsql;

public sealed class NpgsqlDapperConnectionFactory(IConnectionStringProvider connectionStringProvider) : IDapperConnectionFactory
{
    public DbConnection CreateConnection()
    {
        return new NpgsqlConnection(connectionStringProvider.DefaultConnectionString);
    }
}
