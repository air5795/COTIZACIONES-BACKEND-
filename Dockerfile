# Usar la imagen de Node.js
FROM node:21-alpine3.19

RUN apk add --no-cache \
    libreoffice \
    libstdc++ \
    ttf-dejavu \
    fontconfig \
    && apk add --no-cache --virtual .build-deps bash \
    && rm -rf /var/cache/apk/*

# Crear el directorio de trabajo dentro del contenedor
WORKDIR /app

# Crear la carpeta pagos y asignar permisos
RUN mkdir -p /app/pagos-aportes/pagos && chown node:node /app/pagos-aportes/pagos

# Copiar archivos de dependencias e instalar
COPY package.json package-lock.json ./
RUN npm install

# Copiar el resto del código
COPY . .

ENV PATH="/usr/lib/libreoffice/program:${PATH}"
# Exponer el puerto que usa NestJS
EXPOSE 4000

# Comando para iniciar la aplicación
CMD ["npm", "run", "start"]