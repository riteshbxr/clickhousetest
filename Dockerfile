# NodeJS Version 16
FROM node:20-bullseye-slim AS build

# Work to Dir
WORKDIR /usr/src/app

COPY package*.json ./

# Install Node Package
RUN npm install --omit=dev --ignore-scripts

COPY . .

FROM node:20-bullseye-slim

WORKDIR /usr/src/app

COPY --from=build /usr/src/app .

# Cmd script
CMD ["npm", "start"]
