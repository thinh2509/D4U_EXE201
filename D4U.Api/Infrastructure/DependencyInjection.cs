namespace D4U.Api.Infrastructure;

using System.IO;
using System.Text;
using D4U.Api.Application.Common.Data;
using D4U.Api.Application.Common.Files;
using D4U.Api.Application.Common.Security;
using D4U.Api.Application.Features.Ai;
using D4U.Api.Application.Features.Auth;
using D4U.Api.Application.Features.MoneyMovement;
using D4U.Api.Application.Features.Notifications;
using D4U.Api.Application.Features.Payments;
using D4U.Api.Application.Features.Profiles;
using D4U.Api.Application.Features.Projects;
using D4U.Api.Application.Features.Ratings;
using D4U.Api.Infrastructure.Ai;
using D4U.Api.Infrastructure.Authentication;
using D4U.Api.Infrastructure.BackgroundServices;
using D4U.Api.Infrastructure.Caching;
using D4U.Api.Infrastructure.Email;
using D4U.Api.Infrastructure.EmailVerification;
using D4U.Api.Infrastructure.Files;
using D4U.Api.Infrastructure.Payments;
using D4U.Api.Infrastructure.Persistence;
using D4U.Api.Domain.Entities;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;

public static class DependencyInjection
{
    public static ConfigureHostBuilder AddD4ULogging(this ConfigureHostBuilder host)
    {
        host.UseSerilog((context, _, loggerConfiguration) =>
        {
            loggerConfiguration
                .ReadFrom.Configuration(context.Configuration)
                .Enrich.FromLogContext()
                .WriteTo.Console();
        });

        return host;
    }

    public static IServiceCollection AddD4UInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.AddSingleton<IConnectionStringProvider, ConnectionStringProvider>();
        services.AddHttpContextAccessor();

        var dataProtectionKeysPath = configuration["DataProtection:KeysPath"];
        if (string.IsNullOrWhiteSpace(dataProtectionKeysPath))
        {
            dataProtectionKeysPath = Path.Combine(AppContext.BaseDirectory, "App_Data", "data-protection-keys");
        }

        Directory.CreateDirectory(dataProtectionKeysPath);

        services.AddDataProtection()
            .SetApplicationName("D4U.Api")
            .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath));

        services.AddDbContext<D4UDbContext>((serviceProvider, options) =>
        {
            var connectionStringProvider = serviceProvider.GetRequiredService<IConnectionStringProvider>();
            options.UseNpgsql(connectionStringProvider.DefaultConnectionString);
        });

        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IUnitOfWork, EfUnitOfWork>();
        services.AddScoped<IDapperConnectionFactory, NpgsqlDapperConnectionFactory>();
        services.AddScoped<ICurrentUser, CurrentUser>();
        services.AddSingleton<IUploadPathResolver, LocalUploadPathResolver>();
        services.AddScoped<MockAiProjectBriefAssistant>();
        services.AddHttpClient<OpenAiProjectBriefAssistant>((serviceProvider, client) =>
        {
            var options = serviceProvider.GetRequiredService<IConfiguration>()
                .GetSection(AiOptions.SectionName)
                .Get<AiOptions>() ?? new AiOptions();

            client.BaseAddress = new Uri(options.BaseUrl.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(Math.Max(1, options.TimeoutSeconds));
        });
        services.AddScoped<IAiProjectBriefAssistant>(serviceProvider =>
        {
            var options = serviceProvider.GetRequiredService<IConfiguration>()
                .GetSection(AiOptions.SectionName)
                .Get<AiOptions>() ?? new AiOptions();

            return string.Equals(options.Provider, "OpenAI", StringComparison.OrdinalIgnoreCase)
                ? serviceProvider.GetRequiredService<OpenAiProjectBriefAssistant>()
                : serviceProvider.GetRequiredService<MockAiProjectBriefAssistant>();
        });
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<IProjectWorkspaceService, ProjectWorkspaceService>();
        services.AddScoped<ISubmissionFileService, SubmissionFileService>();
        services.AddScoped<IPaymentService, PaymentService>();
        services.AddScoped<IMoneyMovementService, MoneyMovementService>();
        services.AddScoped<IRatingService, RatingService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<INotificationPublisher, NotificationPublisher>();
        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<IGoogleTokenValidator, GoogleTokenValidator>();
        services.AddScoped<IRefreshTokenService, RefreshTokenService>();
        services.AddHostedService<OfferPaymentExpiryBackgroundService>();
        services.AddHostedService<PreExecutionProjectExpiryBackgroundService>();
        services.AddHostedService<SubmissionAutoApprovalBackgroundService>();
        services.AddHostedService<ProjectTotalDeadlineBackgroundService>();
        services.AddHostedService<EscrowReleaseBackgroundService>();
        services.AddHostedService<StudentAbandonmentBackgroundService>();
        services.AddHostedService<SubmissionOrphanCleanupBackgroundService>();
        services.AddScoped<MockPaymentProvider>();
        services.AddHttpClient<PayOsPaymentProvider>((serviceProvider, client) =>
        {
            var options = serviceProvider.GetRequiredService<IConfiguration>()
                .GetSection(PaymentOptions.SectionName)
                .Get<PaymentOptions>() ?? new PaymentOptions();

            client.BaseAddress = new Uri(options.PayOS.BaseUrl.TrimEnd('/'));
        });
        services.AddScoped<IPaymentProvider>(serviceProvider =>
        {
            var options = serviceProvider.GetRequiredService<IConfiguration>()
                .GetSection(PaymentOptions.SectionName)
                .Get<PaymentOptions>() ?? new PaymentOptions();

            return string.Equals(options.Provider, "Mock", StringComparison.OrdinalIgnoreCase)
                ? serviceProvider.GetRequiredService<MockPaymentProvider>()
                : serviceProvider.GetRequiredService<PayOsPaymentProvider>();
        });
        services.AddScoped<IPasswordHasher<User>, PasswordHasher<User>>();
        services.AddSingleton<IConfigurationManager<OpenIdConnectConfiguration>>(serviceProvider =>
        {
            var options = serviceProvider.GetRequiredService<IConfiguration>().GetSection(GoogleAuthOptions.SectionName).Get<GoogleAuthOptions>() ?? new GoogleAuthOptions();
            return new ConfigurationManager<OpenIdConnectConfiguration>(
                options.MetadataAddress,
                new OpenIdConnectConfigurationRetriever());
        });

        services.AddD4URedisCache(configuration);
        services.AddD4UAuthentication(configuration);

        return services;
    }

    public static IServiceCollection AddD4USwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter a JWT bearer token."
            });

            options.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    []
                }
            });
        });

        return services;
    }

    private static IServiceCollection AddD4URedisCache(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var redisOptions = configuration.GetSection(RedisOptions.SectionName).Get<RedisOptions>();

        if (!string.IsNullOrWhiteSpace(redisOptions?.ConnectionString))
        {
            services.AddStackExchangeRedisCache(options =>
            {
                options.Configuration = redisOptions.ConnectionString;
                options.InstanceName = redisOptions.InstanceName;
            });

            return services;
        }

        services.AddDistributedMemoryCache();
        return services;
    }

    private static IServiceCollection AddD4UAuthentication(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<AiOptions>(configuration.GetSection(AiOptions.SectionName));
        services.Configure<GoogleAuthOptions>(configuration.GetSection(GoogleAuthOptions.SectionName));
        services.Configure<EmailOptions>(configuration.GetSection(EmailOptions.SectionName));
        services.Configure<UserEmailVerificationOptions>(configuration.GetSection(UserEmailVerificationOptions.SectionName));
        services.Configure<StudentEmailVerificationOptions>(configuration.GetSection(StudentEmailVerificationOptions.SectionName));
        services.Configure<PaymentOptions>(configuration.GetSection(PaymentOptions.SectionName));
        services.Configure<OAuth2Options>(configuration.GetSection(OAuth2Options.SectionName));
        services.Configure<AdminBootstrapOptions>(configuration.GetSection(AdminBootstrapOptions.SectionName));
        services.Configure<DemoSeedOptions>(configuration.GetSection(DemoSeedOptions.SectionName));

        var jwtOptions = configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();

        var authenticationBuilder = services
            .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.RequireHttpsMetadata = true;
                options.SaveToken = false;
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = !string.IsNullOrWhiteSpace(jwtOptions.Issuer),
                    ValidateAudience = !string.IsNullOrWhiteSpace(jwtOptions.Audience),
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = !string.IsNullOrWhiteSpace(jwtOptions.SigningKey),
                    ValidIssuer = jwtOptions.Issuer,
                    ValidAudience = jwtOptions.Audience
                };

                if (!string.IsNullOrWhiteSpace(jwtOptions.SigningKey))
                {
                    options.TokenValidationParameters.IssuerSigningKey =
                        new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey));
                }
            });

        var oauth2Options = configuration.GetSection(OAuth2Options.SectionName).Get<OAuth2Options>();

        if (oauth2Options?.Enabled == true)
        {
            authenticationBuilder.AddOAuth("OAuth2", options =>
            {
                options.AuthorizationEndpoint = oauth2Options.AuthorizationEndpoint;
                options.TokenEndpoint = oauth2Options.TokenEndpoint;
                options.UserInformationEndpoint = oauth2Options.UserInformationEndpoint;
                options.ClientId = oauth2Options.ClientId;
                options.ClientSecret = oauth2Options.ClientSecret;
                options.CallbackPath = oauth2Options.CallbackPath;
            });
        }

        services.AddAuthorization();

        return services;
    }
}
