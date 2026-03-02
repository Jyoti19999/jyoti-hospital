# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm cache clean --force
RUN npm install

# Copy entire project files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Run all seed scripts

RUN node backend/prisma/seed-ot-equipment.js
RUN node backend/prisma/seed-staff-types.js
RUN node backend/prisma/seed-staff.js
RUN node backend/prisma/seed-superadmin.js

# Expose the backend port
EXPOSE 8080

# Start the app
CMD ["npm", "run", "dev"]