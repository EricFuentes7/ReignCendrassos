using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace cartesWEB;
public class Opcion
{
    [Column("label")]
    public string Label { get; set; } = null!;
    [Column("nextCardId")]
    public int? NextCardId { get; set; }
    [Column("effects")]
    public Efectos Effects { get; set; } = null!;
}