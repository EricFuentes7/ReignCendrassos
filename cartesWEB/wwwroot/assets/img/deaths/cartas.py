import os
from PIL import Image, ImageDraw, ImageFont

def generar_imagenes_muerte():
    # Configuración básica
    size = (500, 500)
    color_fondo = "black"
    color_texto = "white"
    
    # Lista de conceptos y sus estados
    conceptos = ["convivencia", "capacitatsClau", "diners", "educacio"]
    estados = ["0", "100"]
    
    # Intentar cargar una fuente por defecto
    try:
        # En Windows suele estar en esta ruta, en Linux/Mac varía. 
        # Si falla, usará la fuente por defecto de PIL.
        font = ImageFont.truetype("arial.ttf", 40)
    except:
        font = ImageFont.load_default()

    print("Generando imágenes...")

    for concepto in conceptos:
        for estado in estados:
            # Crear imagen negra
            img = Image.new('RGB', size, color=color_fondo)
            draw = ImageDraw.Draw(img)
            
            # Texto a escribir
            texto = f"Muerte por:\n{concepto} {estado}"
            
            # Calcular posición para centrar el texto
            # Usamos textbbox para versiones modernas de Pillow (9.2.0+)
            left, top, right, bottom = draw.textbbox((0, 0), texto, font=font, align="center")
            w, h = right - left, bottom - top
            x = (size[0] - w) / 2
            y = (size[1] - h) / 2
            
            # Dibujar el texto
            draw.multiline_text((x, y), texto, fill=color_texto, font=font, align="center")
            
            # Guardar la imagen
            nombre_archivo = f"muerte_{concepto}_{estado}.png"
            img.save(nombre_archivo)
            print(f"Creada: {nombre_archivo}")

    print("\n¡Proceso finalizado! Las 8 imágenes están en la carpeta del script.")

if __name__ == "__main__":
    generar_imagenes_muerte()