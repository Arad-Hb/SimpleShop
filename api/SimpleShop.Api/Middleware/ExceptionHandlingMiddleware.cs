using System.Net;
using System.Text.Json;

namespace SimpleShop.Api.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, IHostEnvironment environment)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;
            context.Response.ContentType = "application/json; charset=utf-8";

            var response = new
            {
                success = false,
                message = "خطای غیرمنتظره‌ای در سرور رخ داد.",
                detail = environment.IsDevelopment() ? ex.Message : null
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(response));
        }
    }
}
