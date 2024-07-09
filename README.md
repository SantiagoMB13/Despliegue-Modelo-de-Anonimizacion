# Despliegue-Modelo-de-Anonimizacion
Despliegue web del modelo de anonimizacion de datos personales para los registros médicos.

- Los 3 archivos (index.html, index.js, styles.css) son el despliegue serverless del modelo de anonimización. Para poder correrlo localmente sin problemas, se debe desplegar con el comando: python -m http.server. Esto iniciará la página en http://localhost:8000/ donde se podrá probar el modelo.

- En la carpeta Compilers se encuentran los scripts de python para compilar el modelo de pytorch en formato .onnx.

- En la carpeta Versión Servidor-Cliente se encuentra una alternativa de despliegue que utiliza un servidor para ejecutar el modelo y luego desplegar los resultados en el lado del cliente.
