FROM node:20-alpine AS build

# Set work directory
WORKDIR /app

# Build-time API base URL for Vite
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

# Install dependencies
COPY package*.json ./
RUN npm ci

# Build application
COPY . .
RUN npm run build

# Serve with Nginx
FROM nginx:stable-alpine

# Copy custom nginx config (SPA fallback + asset caching)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
