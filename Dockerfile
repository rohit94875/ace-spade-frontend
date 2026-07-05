FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_BASE_PATH=/acespade/
ENV VITE_BASE_PATH=${VITE_BASE_PATH}
RUN npm run build

# Output dist/ — used by the nginx multi-stage build in docker-compose context
FROM scratch
COPY --from=build /app/dist /dist
