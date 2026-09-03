# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

# The base image runs envsubst over /etc/nginx/templates/*.template on startup.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

COPY index.html app.js styles.css /usr/share/nginx/html/

EXPOSE 8080
