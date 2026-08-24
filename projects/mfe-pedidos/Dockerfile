FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx ng build mfe-pedidos--configuration production

FROM nginx:alpine

COPY --from=build /app/dist/mfe-pedidos /usr/share/nginx/html
COPY projects/mfe-payments/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
