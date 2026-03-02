# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Generate Prisma client
RUN npx prisma generate

# Copy project files
COPY . .

# Expose the backend port (make sure this matches your code)
EXPOSE 8080

# Start the app
CMD ["npm", "run", "dev"]