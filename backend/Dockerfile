# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm cache clean --force
RUN npm install

# Copy project files, including prisma folder
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose the backend port
EXPOSE 8080

# Start the app
CMD ["npm", "run", "dev"]