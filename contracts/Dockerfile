FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build contracts
RUN npm run build

# Expose port for Hardhat node
EXPOSE 8545

# Default command
CMD ["npm", "run", "dev"]
