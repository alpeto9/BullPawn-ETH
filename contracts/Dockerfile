FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build contracts
RUN npm run build

# Expose port for health check
EXPOSE 3000

# Default command - keep container running for health checks
CMD ["node", "-e", "console.log('Contracts container ready'); setInterval(() => {}, 1000)"]
