# ============================================
# BUILD
# ============================================
FROM node:20-alpine AS build
WORKDIR /app

# Copiar package.json del workspace
COPY package*.json ./
RUN npm ci

# Copiar el workspace (incluye libs/, projects/, angular.json, etc.)
COPY . .

# Build del shell
RUN npx ng build shell --configuration production

# ============================================
# NGINX
# ============================================
FROM nginx:alpine

# Copiar build del shell
COPY --from=build /app/dist/shell /usr/share/nginx/html

# Copiar nginx config específico del shell
COPY projects/shell/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
