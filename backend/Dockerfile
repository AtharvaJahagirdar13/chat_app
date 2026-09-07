FROM node:22-alpine

RUN apk add --no-cache dumb-init

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node src ./src

ENV NODE_ENV=production \
    PORT=5002

USER node

EXPOSE 5002

ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
