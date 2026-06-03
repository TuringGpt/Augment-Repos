require('module-alias/register');
const mongoose = require('mongoose');
const { globSync } = require('glob');
const path = require('path');

const { logger } = require('./utils/logger');

// Make sure we are running node 7.6+
const [major, minor] = process.versions.node.split('.').map(parseFloat);
if (major < 20) {
  logger.error('Unsupported Node.js version', {
    currentVersion: process.versions.node,
    minimumMajorVersion: 20,
  });
  process.exit();
}

// import environmental variables from our variables.env file
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

mongoose.connect(process.env.DATABASE);

mongoose.connection.on('error', (error) => {
  logger.error('MongoDB connection failed. Check the DATABASE environment variable.', {
    error,
  });
});

const modelsFiles = globSync('./src/models/**/*.js');

for (const filePath of modelsFiles) {
  require(path.resolve(filePath));
}

// Start our app!
const app = require('./app');
app.set('port', process.env.PORT || 8888);
const server = app.listen(app.get('port'), () => {
  logger.info('Express server started', { port: server.address().port });
});
