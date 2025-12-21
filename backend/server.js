const express = require('express');
const cors = require('cors'); // ✅ KEPT THIS (Line 2)
require('dotenv').config();
const path = require('path');
const cookieParser = require('cookie-parser');

const { sequelize } = require('./src/models');
const authRoutes = require('./src/routes/auth.routes');
const complaintRoutes = require('./src/routes/complaint.routes');
const userRoutes = require('./src/routes/user.routes');

const app = express();
const PORT = process.env.PORT || 5001;

// --- Middleware ---

// 🗑️ DELETED the duplicate "const cors" line here. It was crashing your app.

// Allow your Vercel Frontend specifically
app.use(cors({
  origin: ['http://localhost:8080', 'campus-care-eight-azure.vercel.app'],
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/users', userRoutes);

// --- Error Handling ---
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

// --- Start Server ---
async function startServer() {
  try {
    await sequelize.sync();
    console.log('✅ Database synchronized successfully.');
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
  }
}

startServer();