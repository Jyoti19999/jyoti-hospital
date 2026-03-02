# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Expose the backend port (adjust if different)
EXPOSE 5000

# Use nodemon in development
CMD ["npm", "run", "dev"]