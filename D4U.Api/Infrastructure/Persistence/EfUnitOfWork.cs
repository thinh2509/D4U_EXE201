namespace D4U.Api.Infrastructure.Persistence;

using D4U.Api.Application.Common.Data;

public sealed class EfUnitOfWork(D4UDbContext dbContext, IServiceProvider serviceProvider) : IUnitOfWork
{
    public IRepository<TEntity> Repository<TEntity>()
        where TEntity : class
    {
        return serviceProvider.GetRequiredService<IRepository<TEntity>>();
    }

    public Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
