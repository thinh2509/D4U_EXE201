namespace D4U.Api.Infrastructure;

using System.Text;
using D4U.Api.Application.Common.Data;
using D4U.Api.Infrastructure.Authentication;
using D4U.Api.Infrastructure.Caching;
using D4U.Api.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
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

        services.AddDbContext<D4UDbContext>((serviceProvider, options) =>
        {
            var connectionStringProvider = serviceProvider.GetRequiredService<IConnectionStringProvider>();
            options.UseNpgsql(connectionStringProvider.DefaultConnectionString);
        });

        services.AddScoped(typeof(IRepository<>), typeof(EfRepository<>));
        services.AddScoped<IUnitOfWork, EfUnitOfWork>();
        services.AddScoped<IDapperConnectionFactory, NpgsqlDapperConnectionFactory>();

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
        services.Configure<OAuth2Options>(configuration.GetSection(OAuth2Options.SectionName));

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
