namespace cartesAPI;

using MongoDB.Bson;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

public class Carta
{
    [Key]
    [Column("_id")] 
    [JsonIgnore]
    public ObjectId InternalId { get; set; }
    
    [Column("id")]
    [JsonPropertyName("id")]
    public int CartaId { get; set; }
    
    [Column("character")]
    public string Character { get; set; } = null!;
    
    [Column("text")]
    public string Text { get; set; } = null!;
    
    [Column("isRepeatable")]
    public bool IsRepeatable { get; set; }
    
    [Column("requiresCardId")]
    public int? RequiresCardId { get; set; }

    [Column("requiresFlag")]
    public string? RequiresFlag { get; set; }

    // NUEVO: campo para las cartas de tutorial (opcional, solo lo tienen ellas)
    [Column("isTutorial")]
    public bool? IsTutorial { get; set; }

    // Nullable: las cartas de tutorial no tienen left/right
    [Column("left")]
    public Opcion? Left { get; set; }
    
    [Column("right")]
    public Opcion? Right { get; set; }
}
