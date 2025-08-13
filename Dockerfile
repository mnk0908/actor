FROM apify/actor-node:18

# Copy files
COPY package.json package-lock.json ./
RUN npm ci --only=prod
COPY . ./

# Run the actor
CMD [ "node", "main.js" ]