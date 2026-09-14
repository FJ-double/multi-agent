FROM node:22-alpine

WORKDIR /app

COPY runtime/package.json ./package.json
COPY runtime/postman-gateway-macos.js ./postman-gateway-macos.js
COPY runtime/LICENSE ./LICENSE

RUN mkdir -p /accounts /state

ENV HOST=0.0.0.0 \
    PORT=9887 \
    POSTMAN_ACCOUNTS_DIR=/accounts \
    POSTMAN_GATEWAY_STATE_FILE=/state/sessions.json

EXPOSE 9887

CMD ["node", "postman-gateway-macos.js"]
