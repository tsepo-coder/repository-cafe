const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs'); // Updated to use bcryptjs (since bcryptjs is the recommended version for Node.js)
const mysql = require('mysql2'); // Updated to use mysql2 (more robust and better compatibility with async/await)
const jwt = require('jsonwebtoken');

const app = express();
const port = 5000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your frontend URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Database connection
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'login_system'
});

// Test database connection
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to database successfully');
});

connection.query('SELECT 1', (err) => {
  if (err) {
    console.error('Database connection test failed:', err);
    return;
  }
  console.log('Database connection test successful');
});

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, name: user.name },
    process.env.JWT_SECRET || 'your_jwt_secret_key', // Ensure you are using a secure secret from .env
    { expiresIn: '24h' }
  );
};

// Routes
app.get('/test', (req, res) => {
  res.json({ message: 'Server is running properly' });
});

app.post('/users/register', async (req, res) => {
  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ message: 'Name and password are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = 'INSERT INTO users (name, password) VALUES (?, ?)';
    
    connection.query(query, [name, hashedPassword], (err, results) => {
      if (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ message: 'Error during registration', error: err.message });
      }

      const token = generateToken({ id: results.insertId, name });
      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: results.insertId,
          name
        }
      });
    });
  } catch (error) {
    console.error('Password hashing error:', error);
    res.status(500).json({ message: 'Error during registration', error: error.message });
  }
});

app.post('/users/login', (req, res) => {
  const { name, password } = req.body;
  console.log('Login attempt for user:', name);

  if (!name || !password) {
    return res.status(400).json({ message: 'Name and password are required' });
  }

  const query = 'SELECT * FROM users WHERE name = ?';
  connection.query(query, [name], async (err, results) => {
    if (err) {
      console.error('Database error during login:', err);
      return res.status(500).json({ message: 'Database error', error: err.message });
    }

    if (results.length === 0) {
      return res.status(401).json({ message: 'Invalid name or password' });
    }

    try {
      const match = await bcrypt.compare(password, results[0].password);
      
      if (!match) {
        return res.status(401).json({ message: 'Invalid name or password' });
      }

      const token = generateToken(results[0]);
      console.log('Login successful for user:', name);

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: results[0].id,
          name: results[0].name,
        }
      });
    } catch (error) {
      console.error('Password comparison error:', error);
      res.status(500).json({ message: 'Error during authentication', error: error.message });
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
