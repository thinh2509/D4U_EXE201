namespace D4U.Api.Application.Common.Data;

using System.Data.Common;

public interface IDapperConnectionFactory
{
    DbConnection CreateConnection();
}
