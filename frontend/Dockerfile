# Stage 1: Build the React Application
FROM node:20-alpine AS build

WORKDIR /app

# Install package dependencies
COPY package*.json ./
RUN npm ci

# Copy codebase
COPY . .

# Build application for production
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build output from Stage 1 to Nginx HTML folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose Nginx port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
