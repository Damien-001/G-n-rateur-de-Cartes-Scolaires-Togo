# 1. Étape de build (Node.js)
FROM node:20-alpine AS builder
WORKDIR /app

# Optimisation du cache Docker pour les dépendances
COPY package*.json ./
RUN npm ci

# Copie du code source
COPY . .

# Arguments de build (injectés depuis le .env au build)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG GEMINI_API_KEY
ARG APP_URL

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV APP_URL=$APP_URL

# Compilation de l'application Vite (génération du dossier /dist)
RUN npm run build

# 2. Étape de production (Nginx Alpine ultra-léger)
FROM nginx:alpine AS runner

# Copie de la configuration Nginx sur mesure
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie du résultat du build
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
