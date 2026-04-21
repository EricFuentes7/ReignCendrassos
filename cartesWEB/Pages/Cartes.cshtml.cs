using Microsoft.AspNetCore.Mvc.RazorPages;

namespace cartesWEB.Pages;

public class Cartes : PageModel
{
    private IHttpClientFactory _fabrica;
    
    public List<Carta> cartes { get; set; } = new();
    
    public Cartes(IHttpClientFactory fabrica)
    {
        _fabrica = fabrica;
    }
    
    public async Task OnGet()
    {
        /*
        var client = _fabrica.CreateClient();
        var resultat = await client.GetFromJsonAsync<List<Carta>>("http://localhost:5239/inicialitzaCartes");
        if (resultat == null)
        {
            throw new Exception("Error");
        }

        cartes = resultat;
        */
    }
}