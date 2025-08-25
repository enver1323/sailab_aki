FROM node:16-alpine AS builder
ENV NODE_ENV production

WORKDIR /app

COPY package.json .
COPY yarn.lock .

RUN yarn install --production

#COPY ./.docker/entrypoint.sh /entrypoint.sh
#RUN chmod +x /entrypoint.sh
#
COPY . .
#
#RUN sh /entrypoint.sh

RUN yarn build

# Bundle static assets with nginx
FROM nginx:1.21.0-alpine as production
ENV NODE_ENV production
# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html
# Add your nginx.conf
COPY ./.docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf
# Start nginx
CMD ["nginx", "-g", "daemon off;"]