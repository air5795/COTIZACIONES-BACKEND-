# Usar la imagen de Node.js
FROM node:18-alpine

# Crear el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar archivos de dependencias e instalar
COPY package.json package-lock.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto que usa NestJS
EXPOSE 4000

# Comando para iniciar la aplicación
CMD ["npm", "run", "start"]
