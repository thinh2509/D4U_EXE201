namespace D4U.Api.Infrastructure.Persistence.Configurations;

using D4U.Api.Domain.Entities;
using D4U.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

public sealed class PaymentMethodConfiguration : IEntityTypeConfiguration<PaymentMethod>
{
    public void Configure(EntityTypeBuilder<PaymentMethod> entity)
    {
        entity.ToTable("payment_methods");
        entity.HasKey(method => method.Id);

        entity.Property(method => method.Id).HasColumnName("id");
        entity.Property(method => method.UserId).HasColumnName("user_id").IsRequired();
        entity.Property(method => method.MethodType).HasColumnName("method_type").HasMaxLength(50).HasDefaultValue("BANK_ACCOUNT").IsRequired();
        entity.Property(method => method.BankName).HasColumnName("bank_name").HasMaxLength(120);
        entity.Property(method => method.BankCode).HasColumnName("bank_code").HasMaxLength(30);
        entity.Property(method => method.AccountHolderName).HasColumnName("account_holder_name").HasMaxLength(255);
        entity.Property(method => method.MaskedAccountNumber).HasColumnName("masked_account_number").HasMaxLength(100);
        entity.Property(method => method.AccountNumberEncrypted).HasColumnName("account_number_encrypted").HasColumnType("text");
        entity.Property(method => method.ProviderToken).HasColumnName("provider_token").HasMaxLength(255);
        entity.Property(method => method.IsDefault).HasColumnName("is_default").HasDefaultValue(false).IsRequired();
        entity.Property(method => method.Status).HasColumnName("status").HasMaxLength(50).HasDefaultValue("ACTIVE").IsRequired();
        entity.Property(method => method.CreatedAt).HasColumnName("created_at").IsRequired();

        entity.HasOne<User>().WithMany().HasForeignKey(method => method.UserId).OnDelete(DeleteBehavior.Restrict);
    }
}
