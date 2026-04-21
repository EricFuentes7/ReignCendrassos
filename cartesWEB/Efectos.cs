using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
namespace cartesWEB;

public class Efectos
{
    [Column("educacio")]
    public int Educacio { get; set; }
    [Column("convivencia")]
    public int Convivencia { get; set; }
    [Column("diners")]
    public int Diners { get; set; }
    [Column("capacitatsClau")]
    public int CapacitatsClau { get; set; }
}