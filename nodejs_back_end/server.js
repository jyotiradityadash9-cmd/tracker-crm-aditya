const app = require('./app');
const { initializeDatabase, sequelize } = require('./config/database');
const seedDatabase = require('./models/seed');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    // 1. Check & create database if not exists
    await initializeDatabase();

    // 2. Authenticate Sequelize connection
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // 3. Sync Models (alter: true or force: false depending on migration preference)
    await sequelize.sync({ alter: true });
    console.log('Database models synced successfully.');

    // 4. Seed database
    await seedDatabase();

    // 5. Start listening
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Swagger documentation is available at http://localhost:${PORT}/api-docs`);
    });

  } catch (error) {
    console.error('Unable to start the server:', error);
    process.exit(1);
  }
};

startServer();
