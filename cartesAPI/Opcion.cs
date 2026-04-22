using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace cartesAPI;
public class Opcion
{
    [Column("label")]
    public string Label { get; set; } = null!;
    
    [Column("nextCardId")]
    public int? NextCardId { get; set; }
    
    [Column("effects")]
    public Efectos Effects { get; set; } = null!;

    // NUEVO: Sistema de banderas
    [Column("setFlag")]
    public string? SetFlag { get; set; }
    
    [Column("removeFlag")]
    public string? RemoveFlag { get; set; }
}