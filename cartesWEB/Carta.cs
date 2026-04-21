
namespace cartesWEB;

using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

public class Carta
{
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
    [Column("left")]
    public Opcion Left { get; set; } = null!;
    [Column("right")]
    public Opcion Right { get; set; } = null!;
}