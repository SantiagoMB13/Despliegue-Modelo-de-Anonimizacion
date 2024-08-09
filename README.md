# 🛡️ Proyecto de Anonimización de Registros Médicos

Este proyecto es una solución completa para la **anonimización de registros médicos** directamente en el navegador. Utiliza modelos de inteligencia artificial para identificar y anonimizar automáticamente información sensible en textos, asegurando la privacidad de los datos médicos.

## 🚀 Descripción

El propósito de este proyecto es proporcionar una herramienta fácil de usar para anonimizar registros médicos. Está diseñado para procesar texto ingresado manualmente o cargado desde archivos (.txt, .pdf, .docx), utilizando un modelo de **Reconocimiento de Entidades Nombradas (NER)** entrenado en múltiples idiomas.

### Características principales:
- **Anonimización automática**: Detecta y reemplaza información sensible como nombres, ubicaciones y organizaciones.
- **Modo avanzado**: Usa la biblioteca Faker.js para reemplazar entidades con datos falsos pero plausibles.
- **Interfaz intuitiva**: Interactúa con la aplicación directamente desde el navegador.
- **Procesamiento de múltiples formatos**: Soporta archivos `.txt`, `.pdf` y `.docx`.
- **Anonimización en lote**: Procesa múltiples archivos a la vez y genera archivos anonimizados.

## 🛠️ Tecnologías Utilizadas

- **JavaScript**: Lenguaje principal para la lógica de la aplicación.
- **Transformers.js**: Biblioteca para desplegar modelos de Hugging Face directamente en el navegador.
- **Faker.js**: Genera datos falsos pero realistas para la anonimización avanzada.
- **JSZip**: Permite descargar múltiples archivos como un archivo ZIP.
- **pdf.js**: Extrae texto de archivos PDF.
- **Mammoth.js**: Convierte archivos `.docx` a texto plano.

## 📦 Instalación y Ejecución

Para usar esta herramienta en tu entorno local:

1. **Clona el repositorio**:
   ```bash
   git clone https://github.com/tuusuario/nombre-del-repositorio.git

