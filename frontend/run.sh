#!/usr/bin/env bash
. .env

# docker build -t directory-service-fe .
docker pull ghcr.io/looprock/directory_service_frontend:dev-latest

docker run -d \
-p 3000:3000 \
-e NEXTAUTH_URL=${NEXTAUTH_URL} \
-e NEXTAUTH_SECRET=${NEXTAUTH_SECRET} \
-e API_URL=${API_URL} \
-e ADMIN_API_KEY=${ADMIN_API_KEY} \
-e GOOGLE_ID=${GOOGLE_ID} \
-e GOOGLE_SECRET=${GOOGLE_SECRET} \
ghcr.io/looprock/directory_service_frontend:dev-latest
