import os
from PIL import Image

def comprimir_pngs_maximo(directorio="."):
    print("Iniciando compresión MÁXIMA de imágenes PNG...")
    
    for nombre_archivo in os.listdir(directorio):
        if nombre_archivo.lower().endswith(".png"):
            ruta_completa = os.path.join(directorio, nombre_archivo)
            
            try:
                # 1. Abrimos la imagen
                imagen = Image.open(ruta_completa)
                
                # 2. Reducimos la paleta de colores a 256 (Pérdida visual mínima, ahorro de espacio masivo)
                # Esto mantiene la transparencia intacta si la imagen la tiene.
                imagen_optimizada = imagen.quantize(colors=256)
                
                # 3. Guardamos sobrescribiendo el archivo original
                # compress_level=9 fuerza al algoritmo interno a comprimir los datos al máximo
                imagen_optimizada.save(
                    ruta_completa, 
                    format="PNG", 
                    optimize=True, 
                    compress_level=9
                )
                
                print(f"✅ Compresión extrema aplicada: {nombre_archivo}")
                
            except Exception as e:
                print(f"❌ Error al procesar {nombre_archivo}: {e}")

    print("¡Proceso terminado!")

if __name__ == "__main__":
    comprimir_pngs_maximo()
