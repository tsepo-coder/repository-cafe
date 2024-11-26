const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables from the .env file
dotenv.config();

// Create the MySQL connection
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Connect to the MySQL database
connection.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to the database as id ' + connection.threadId);
});

// Function to handle adding a product
const addProduct = (name, description, category, price, quantity, callback) => {
  const query = 'INSERT INTO products (name, description, category, price, quantity) VALUES (?, ?, ?, ?, ?)';
  connection.query(query, [name, description, category, price, quantity], callback);
};

// Function to handle updating product details
const updateProduct = (id, name, description, category, price, quantity, callback) => {
  const query = 'UPDATE products SET name = ?, description = ?, category = ?, price = ?, quantity = ? WHERE id = ?';
  connection.query(query, [name, description, category, price, quantity, id], callback);
};

// Function to handle deleting a product
const deleteProduct = (id, callback) => {
  const query = 'DELETE FROM products WHERE id = ?';
  connection.query(query, [id], callback);
};

// Function to get all products from the database
const getAllProducts = (callback) => {
  const query = 'SELECT * FROM products';
  connection.query(query, callback);
};

// Function to get products with low stock levels
const getLowStockProducts = (threshold, callback) => {
  const query = 'SELECT * FROM products WHERE quantity < ?';
  connection.query(query, [threshold], callback);
};

// Function to add stock to an existing product
const addStock = (productId, quantity, callback) => {
  const query = 'UPDATE products SET quantity = quantity + ? WHERE id = ?';
  connection.query(query, [quantity, productId], callback);
};

// Function to deduct stock from an existing product
const deductStock = (productId, quantity, callback) => {
  const query = 'UPDATE products SET quantity = quantity - ? WHERE id = ?';
  connection.query(query, [quantity, productId], callback);
};

// Export the connection and utility functions
module.exports = {
  connection,
  addProduct,
  updateProduct,
  deleteProduct,
  getAllProducts,
  getLowStockProducts,
  addStock,
  deductStock,
};
