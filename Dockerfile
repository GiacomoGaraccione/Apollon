FROM node:20-bullseye-slim
WORKDIR /app

# Copy everything
COPY . .



# Install dependencies & build
RUN npm install
ARG PUBLIC_URL=/umlegend
ENV PUBLIC_URL=$PUBLIC_URL

RUN npm run build

# Install serve globally
RUN npm install -g serve

EXPOSE 3000
CMD ["npx", "serve", "-s", "dist", "-l", "3000", "--single"]
