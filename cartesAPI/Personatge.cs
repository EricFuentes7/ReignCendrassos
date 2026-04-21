using MongoDB.Bson;
using MongoDB.EntityFrameworkCore.Extensions;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace cartesAPI;

public class Personatge
{
    [Key]
    [Column("_id")]
    [JsonIgnore]
    public ObjectId InternalId { get; set; }

    [Column("key")] 
    public string Key { get; set; } = null!;

    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("image")]
    public string Image { get; set; } = null!;
}