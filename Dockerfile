# ================ #
#    Base Stage    #
# ================ #

FROM node:16-buster-slim as base

WORKDIR /usr/src/app

ENV HUSKY=0
ENV CI=true

RUN apt-get update && \
    apt-get upgrade -y --no-install-recommends && \
    apt-get install -y --no-install-recommends build-essential python3 libfontconfig1 dumb-init && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

COPY --chown=node:node yarn.lock .
COPY --chown=node:node package.json .
COPY --chown=node:node assets/ assets/
COPY --chown=node:node .yarnrc.yml .
COPY --chown=node:node .yarn/ .yarn/

RUN sed -i 's/"prepare": "husky install .github\/husky"/"prepare": ""/' ./package.json

ENTRYPOINT ["dumb-init", "--"]

# ================ #
#   Builder Stage  #
# ================ #

FROM base as builder

ENV NODE_ENV="development"

COPY --chown=node:node tsconfig.base.json tsconfig.base.json
COPY --chown=node:node scripts/ scripts/
COPY --chown=node:node src/ src/

RUN yarn install --immutable
RUN yarn run build

# ================ #
#   Runner Stage   #
# ================ #

FROM base AS runner

ENV NODE_ENV="production"
ENV NODE_OPTIONS="--max_old_space_size=4096"

COPY --chown=node:node scripts/audio/ scripts/audio/
COPY --chown=node:node scripts/workerTsLoader.js scripts/workerTsLoader.js
COPY --chown=node:node src/.env src/.env
COPY --chown=node:node --from=builder /usr/src/app/dist dist

RUN yarn workspaces focus --all --production

USER node

CMD [ "yarn", "run", "start"]
