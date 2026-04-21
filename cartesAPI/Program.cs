using cartesAPI;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
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

var app = builder.Build();app.UseSwagger();
app.UseSwaggerUI();


//test
app.MapGet("/inicialitzaCartes", async (CartasDbContext db) => 
await db.Cartas.ToListAsync());
app.Run();
