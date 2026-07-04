const { Sequelize } = require('sequelize');
const mysql = require('mysql2/promise');
require('dotenv').config();

const host = process.env.DB_HOST || 'localhost';
const port = process.env.DB_PORT || 3306;
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASS || '';
const database = process.env.DB_NAME || 'lead_tracker';

const initializeDatabase = async () => {
  // If database is hosted remotely (like Clever Cloud), it is pre-created. Skip creation.
  if (host !== 'localhost' && host !== '127.0.0.1') {
    console.log('Using remote database host. Skipping manual database creation check.');
    return;
  }
  try {
    // Create connection to MySQL server without database first
    const connection = await mysql.createConnection({ host, port, user, password });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await connection.end();
    console.log(`Database '${database}' checked/created successfully.`);
  } catch (error) {
    console.error('Error creating database:', error);
  }
};

const sequelize = new Sequelize(database, user, password, {
  host: host,
  port: port,
  dialect: 'mysql',
  logging: false, // Set to console.log to see SQL queries
  define: {
    timestamps: true,
  }
});

module.exports = {
  sequelize,
  initializeDatabase
};
