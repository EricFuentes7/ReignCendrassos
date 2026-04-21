using cartesAPI;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirTodo", policy =>
    {
        policy.AllowAnyOrigin()   
              .AllowAnyHeader() 
              .AllowAnyMethod();
    });
});

//swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// appsettingsdata
var mongoSection = builder.Configuration.GetSection("MongoDbSettings");
var connectionString = mongoSection["ConnectionString"];
var databaseName = mongoSection["DatabaseName"];

builder.Services.AddDbContext<CartasDbContext>(options =>
{
    options.UseMongoDB(connectionString, databaseName);
});

builder.Services.AddSingleton<CartasStore>();
var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<CartasDbContext>();
    var store = scope.ServiceProvider.GetRequiredService<CartasStore>();

    store.Cartas = db.Cartas.ToList(); 
    store.Personatges = db.Personatges.ToList();
}

app.UseCors("PermitirTodo");

//test
/*
app.MapGet("/inicialitzaCartes", async (CartasDbContext db) => 
await db.Cartas.ToListAsync());
app.MapGet("/personatges", async (CartasDbContext db) => 
    await db.Personatges.ToListAsync());
*/
app.MapGet("/cartes", (CartasStore store) => 
    Results.Ok(store.Cartas));

app.MapGet("/persones", (CartasStore store) => 
    Results.Ok(store.Personatges));

app.MapGet("/persona/{key}", (string key, CartasStore store) =>
{
    var personatgeSeleccionat = store.Personatges.FirstOrDefault(p => p.Key == key);

    if (personatgeSeleccionat != null)
    {
        return Results.Ok(personatgeSeleccionat);
    }

    return Results.NotFound("personatge no trobat.");
});

app.Run();
