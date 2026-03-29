# Stage 1: Build
FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GROQ_API_KEY
ARG VITE_TEST_ANALYSIS_API_URL
ARG VITE_MENTOR_API_URL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GROQ_API_KEY=$VITE_GROQ_API_KEY
ENV VITE_TEST_ANALYSIS_API_URL=$VITE_TEST_ANALYSIS_API_URL
ENV VITE_MENTOR_API_URL=$VITE_MENTOR_API_URL

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Serve with nginx
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Defaults for docker-compose (overridden by Railway env vars)
ENV PORT=80
ENV BACKEND_URL=http://backend:8000
ENV MENTOR_URL=http://mentor:8000

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
