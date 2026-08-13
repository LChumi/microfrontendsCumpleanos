FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npx ng build mfe-auth --configuration production

FROM nginx:alpine

COPY --from=build /app/dist/mfe-auth /usr/share/nginx/html
COPY projects/mfe-auth/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
