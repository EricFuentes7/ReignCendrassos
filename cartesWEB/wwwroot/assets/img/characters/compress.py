import os
from PIL import Image
import shutil

def procesar_imagenes():
    # 1. Configuración de rutas
    directorio_actual = os.getcwd()
    carpeta_old = os.path.join(directorio_actual, 'old')
    # Extensiones que el script buscará
    formatos_validos = ('.jpg', '.jpeg', '.png', '.webp', '.bmp')

    if not os.path.exists(carpeta_old):
        os.makedirs(carpeta_old)

    # 2. Obtener lista de imágenes
    archivos = [f for f in os.listdir(directorio_actual) 
                if f.lower().endswith(formatos_validos)]

    if not archivos:
        print("No se encontraron imágenes en esta carpeta.")
        return

    for nombre_archivo in archivos:
        ruta_original = os.path.join(directorio_actual, nombre_archivo)
        ruta_backup = os.path.join(carpeta_old, nombre_archivo)
        
        # Extraer la extensión para mantener el formato original
        extension = os.path.splitext(nombre_archivo)[1].lower()

        try:
            # 3. Mover original a la carpeta 'old'
            shutil.move(ruta_original, ruta_backup)

            # 4. Procesar la imagen desde 'old'
            with Image.open(ruta_backup) as img:
                # Redimensionar a 500x500
                # LANCZOS es el filtro de mayor calidad para reducción
                img_redimensionada = img.resize((500, 500), Image.Resampling.LANCZOS)

                # 5. Guardar con el mismo formato y optimización
                # Mantenemos el formato original (PNG, JPEG, etc.)
                formato_pil = img.format 
                
                # Para JPEG y WebP usamos optimización de peso
                if formato_pil in ['JPEG', 'JPG', 'WEBP']:
                    img_redimensionada.save(ruta_original, format=formato_pil, optimize=True, quality=85)
                # Para PNG usamos compresión de archivo
                elif formato_pil == 'PNG':
                    img_redimensionada.save(ruta_original, format=formato_pil, optimize=True, compress_level=9)
                else:
                    # Otros formatos (BMP, etc.)
                    img_redimensionada.save(ruta_original, format=formato_pil)

                print(f"✅ Procesada: {nombre_archivo} [Formato: {formato_pil}]")

        except Exception as e:
            print(f"❌ Error con {nombre_archivo}: {e}")

if __name__ == "__main__":
    procesar_imagenes()
    print("\nProceso terminado. Las originales están en la carpeta /old")
