FROM node:12 AS node-builder
USER node
RUN mkdir /home/node/fxa-payments-server
WORKDIR /home/node/fxa-payments-server
COPY package*.json ./
COPY scripts/postinstall.sh ./scripts/postinstall.sh
RUN npm install
COPY ../fxa-content-server ./node_modules/fxa-content-server

FROM node:12-slim
USER node
RUN mkdir /home/node/fxa-payments-server
WORKDIR /home/node/fxa-payments-server
COPY --chown=node:node --from=node-builder /home/node/fxa-payments-server .
COPY --chown=node:node . .
