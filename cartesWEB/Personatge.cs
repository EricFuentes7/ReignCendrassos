using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace cartesWEB;

public class Personatge
{

    [Column("key")] 
    public string Key { get; set; } = null!;

    [Column("name")]
    public string Name { get; set; } = null!;

    [Column("image")]
    public string Image { get; set; } = null!;
}