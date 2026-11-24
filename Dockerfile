# Imagen del FRONTEND para levantar todo en local con docker-compose.yml (raíz del repo).
# En AWS no se usa: allí GitHub Actions compila dist/ y lo sirve con deploy/docker-compose.yml.

# ---------- 1) Compilación (Vite) ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY index.html vite.config.js ./
COPY public public
COPY src src

# Vite incrusta la URL de la API en el JavaScript al compilar (igual que en el workflow frontend.yml).
ARG VITE_API_URL=http://localhost:8080/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- 2) Servidor (nginx, mismo nginx.conf que la EC2 de frontend) ----------
FROM nginx:1.27-alpine
COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
