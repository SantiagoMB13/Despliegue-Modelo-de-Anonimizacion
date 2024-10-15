# Usar la imagen de Nginx como base
FROM nginx:alpine

# Establecer el directorio de trabajo
WORKDIR /usr/share/nginx/html

# Eliminar archivos por defecto de Nginx
RUN rm -rf ./*

# Copiar los archivos de tu proyecto al contenedor
COPY . .

# Exponer el puerto 80
EXPOSE 80

# Iniciar Nginx
CMD ["nginx", "-g", "daemon off;"]
