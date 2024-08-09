# 🛡️ Proyecto de Anonimización de Registros Médicos

Este proyecto es una solución completa para la **anonimización de registros médicos** directamente en el navegador. Utiliza modelos de inteligencia artificial para identificar y anonimizar automáticamente información sensible en textos, asegurando la privacidad de los datos médicos pero manteniendo la coherencia de forma que la información se mantiene relevante.

## 🚀 Descripción

El propósito de este proyecto es proporcionar una herramienta fácil de usar para anonimizar registros médicos. Está diseñado para procesar texto ingresado manualmente o cargado desde archivos (.txt, .pdf, .docx), utilizando un modelo de **Reconocimiento de Entidades Nombradas (NER)** entrenado en múltiples idiomas.

### Características principales:
- **Anonimización automática**: Detecta y reemplaza información sensible como nombres, ubicaciones y organizaciones.
- **Modo avanzado**: Usa la biblioteca Faker.js para reemplazar entidades con datos falsos pero plausibles.
- **Interfaz intuitiva**: Interactúa con la aplicación directamente desde el navegador.
- **Procesamiento de múltiples formatos**: Soporta archivos `.txt`, `.pdf` y `.docx`.
- **Anonimización en lote**: Procesa múltiples archivos a la vez y genera archivos anonimizados.
- **Conservación de la relación de fechas**: Todas las fechas se desplazan un mismo intervalo de tiempo para mantener la relación entre ellas.

## 🛠️ Tecnologías Utilizadas

- **JavaScript**: Lenguaje principal para la lógica de la aplicación.
- **Transformers.js**: Biblioteca para desplegar modelos de Hugging Face directamente en el navegador.
- **Faker.js**: Genera datos falsos pero realistas para la anonimización avanzada.
- **JSZip**: Permite descargar múltiples archivos como un archivo ZIP.
- **pdf.js**: Extrae texto de archivos PDF.
- **Mammoth.js**: Convierte archivos `.docx` a texto plano.

## 📦 Instalación y Ejecución

- **Para usar esta herramienta en la nube:**
   https://modelo-de-anonimizacion.vercel.app/

- **Para usar esta herramienta en tu entorno local**:

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/tuusuario/nombre-del-repositorio.git
2. **Navega a la carpeta del proyecto**:
    ```bash
    cd nombre-del-repositorio
3. **Despliega el programa en un servidor local**:
   ```bash
   python -m http.server

## ⚙️ Requisitos

No se necesitan dependencias adicionales. Todo se carga a través de CDN en el navegador.

## 👨‍💻 Uso

### 1. Anonimización de Texto
   - Ingresa o pega el texto en el campo de texto.
   - Selecciona el modo de anonimización: **Genérico** o **Avanzado**.
   - Haz clic en **"Anonimizar Texto"**.
   - Descarga el archivo anonimizado.

### 2. Anonimización de Archivos
   - Sube uno o más archivos (.txt, .pdf, .docx).
   - Selecciona el modo de anonimización.
   - Haz clic en **"Procesar Archivos"**.
   - Descarga el archivo o archivos anonimizados individualmente o como un archivo ZIP.

### Modos de Anonimización:
- **Genérico**: Reemplaza entidades detectadas con términos genéricos como `[persona]`, `[lugar]`, `[organización]`.
- **Avanzado**: Reemplaza entidades con datos falsos pero verosímiles, generados con Faker.js.

## 🎯 Objetivos y Beneficios

El objetivo principal de este proyecto es proporcionar una herramienta que permita a los profesionales de la salud, investigadores, y organizaciones manejar registros médicos de manera segura, asegurando la protección de la identidad de los pacientes.

### Beneficios:
- **Privacidad**: Protección integral de la información sensible.
- **Simplicidad**: Procesamiento fácil y directo desde el navegador.
- **Versatilidad**: Soporte para múltiples formatos de archivo.
- **Seguridad**: Todo el procesamiento ocurre en el navegador. No se envía información a servidores externos.
- **Compatibilidad**: Probado en los navegadores más recientes (Chrome, Firefox, Edge).

---

¡Gracias por usar esta herramienta! Si encuentras útil este proyecto, considera darle una ⭐ en GitHub.

