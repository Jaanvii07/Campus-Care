const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path');
const cookieParser = require('cookie-parser');

const { sequelize } = require('./src/models'); // <-- UPDATED IMPORT
const authRoutes = require('./src/routes/auth.routes');
const complaintRoutes = require('./src/routes/complaint.routes');
const userRoutes = require('./src/routes/user.routes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
    origin: 'http://localhost:8080',
    credentials: true 
}));
app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);

// ... (Error handling middleware is the same) ...
app.use((err, req, res, next) => {
  if (err instanceof require('multer').MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    if (err.message === 'Only image files are allowed!') {
        return res.status(400).json({ message: err.message });
    }
    console.error(err.stack);
    return res.status(500).json({ message: 'Something broke!'});
  }
  next();
});

// Database synchronization and server start
async function startServer() {
  try {
    // Use the sequelize instance from the models index
    await sequelize.sync({ alter: true }); 
    console.log('✅ Database synchronized successfully.');
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

startServer();