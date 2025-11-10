const express = require('express');
const cors = require('cors');
require('dotenv').config();
const path = require('path'); // <-- IMPORT PATH MODULE

const sequelize = require('./src/config/database');
const authRoutes = require('./src/routes/auth.routes');
const complaintRoutes = require('./src/routes/complaint.routes');

// Import models to ensure they are part of the Sequelize instance before sync
require('./src/models/user.model');
require('./src/models/complaint.model');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the 'uploads' directory <-- ADD THIS LINE
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);

// Error Handling Middleware (handles upload errors)
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