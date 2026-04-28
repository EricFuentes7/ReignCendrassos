import os
from PIL import Image, ImageOps

def procesar_imagenes():
    # Definir las extensiones que queremos procesar
    extensiones_validas = ('.png', '.jpg', '.jpeg', '.bmp', '.tiff', '.webp')
    
    # Crear una carpeta de salida para no destruir los archivos originales
    carpeta_salida = "procesadas"
    if not os.path.exists(carpeta_salida):
        os.makedirs(carpeta_salida)

    # Recorrer todos los archivos de la carpeta actual (.)
    for archivo in os.listdir('.'):
        if archivo.lower().endswith(extensiones_validas):
            ruta_archivo = os.path.join('.', archivo)
            
            try:
                # 1. Abrir la imagen
                img = Image.open(ruta_archivo)
                
                # 2. Convertir a RGB (necesario para que ImageOps.invert funcione bien)
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # 3. Invertir los colores
                img_invertida = ImageOps.invert(img)
                
                # 4. Convertir a RGBA para habilitar el canal Alfa (transparencia)
                img_rgba = img_invertida.convert("RGBA")
                
                # 5. Eliminar el color blanco
                datos = img_rgba.getdata()
                nuevos_datos = []
                
                # Usamos un pequeño umbral (> 240) por si el blanco no es 100% puro
                for pixel in datos:
                    # pixel es una tupla (R, G, B, A)
                    if pixel[0] > 240 and pixel[1] > 240 and pixel[2] > 240:
                        # Reemplazar el pixel blanco por uno totalmente transparente
                        nuevos_datos.append((255, 255, 255, 0))
                    else:
                        # Mantener el pixel original
                        nuevos_datos.append(pixel)
                        
                img_rgba.putdata(nuevos_datos)
                
                # 6. Guardar la imagen (siempre en PNG para conservar la transparencia)
                nombre_sin_ext = os.path.splitext(archivo)[0]
                ruta_salida = os.path.join(carpeta_salida, f"{nombre_sin_ext}_transparente.png")
                
                img_rgba.save(ruta_salida, "PNG")
                print(f"✅ Procesada con éxito: {archivo} -> {ruta_salida}")
                
            except Exception as e:
                print(f"❌ Error procesando {archivo}: {e}")

if __name__ == "__main__":
    print("Iniciando procesamiento de imágenes...")
    procesar_imagenes()
    print("¡Proceso finalizado!")
