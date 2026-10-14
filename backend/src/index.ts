import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Product from './Product.js';
import User from './User.js';
import { authMiddleware, AuthRequest } from './middleware/auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'proofkeep_jwt_secret_key_2026_secure';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage for device images
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

const PRODUCT_CATEGORIES = [
  'Electronics',
  'Accessories',
  'Home appliances',
  'Other',
] as const;

type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

function isProductCategory(value: unknown): value is ProductCategory {
  return (
    typeof value === 'string' &&
    PRODUCT_CATEGORIES.some((category) => category === value)
  );
}

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Serve uploaded device images statically
app.use('/uploads', express.static(uploadsDir));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'ProofKeep backend is running!',
    dbConnected: mongoose.connection.readyState === 1,
  });
});

// Check DB connection status for API routes that need the database
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (mongoose.connection.readyState !== 1) {
    res.status(503).json({
      message:
        'Database connection is not ready. If using MongoDB Atlas, make sure your IP (or 0.0.0.0/0) is whitelisted under Network Access.',
    });
    return;
  }
  next();
});

// ==========================================
// AUTHENTICATION ROUTES
// ==========================================

// Register a new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({ message: 'Name must be at least 2 characters.' });
      return;
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ message: 'Please provide a valid email address.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      res.status(400).json({ message: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
    });

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Failed to create account.' });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      res.status(400).json({ message: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(String(password), user.password);
    if (!isMatch) {
      res.status(400).json({ message: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Failed to sign in.' });
  }
});

// Get current user profile
app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch user profile.' });
  }
});

// ==========================================
// IMAGE UPLOAD ROUTE
// ==========================================

// Upload a device image
app.post(
  '/api/upload',
  authMiddleware,
  upload.single('image'),
  (req: AuthRequest, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: 'No image file provided.' });
        return;
      }

      // Return static URL for frontend access
      const fileUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`;
      res.status(201).json({
        imageUrl: fileUrl,
        filename: req.file.filename,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: 'Failed to upload image.' });
    }
  }
);

// ==========================================
// PRODUCT / DEVICE ROUTES
// ==========================================

// Get products for the authenticated user
app.get('/api/products', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    // Return products belonging to this user (or legacy products without user)
    const products = await Product.find({
      $or: [{ user: userId }, { user: { $exists: false } }, { user: null }],
    }).sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error('Fetch products error:', error);
    res.status(500).json({ message: 'Failed to fetch products' });
  }
});

// Add a product / device
app.post('/api/products', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { name, category, purchaseDate, warrantyMonths, icon, image } = req.body;

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      !isProductCategory(category) ||
      typeof purchaseDate !== 'string' ||
      !purchaseDate ||
      !Number.isFinite(Number(warrantyMonths)) ||
      Number(warrantyMonths) < 0
    ) {
      res.status(400).json({
        message: 'Please provide valid product details',
      });
      return;
    }

    const product = await Product.create({
      name: name.trim(),
      category,
      purchaseDate,
      warrantyMonths: Number(warrantyMonths),
      icon: typeof icon === 'string' ? icon : '📦',
      image: typeof image === 'string' ? image : '',
      user: req.user?.userId,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(400).json({ message: 'Failed to create product' });
  }
});

// Update a product / device
app.put('/api/products/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const filter = {
      _id: req.params.id,
      $or: [{ user: userId }, { user: { $exists: false } }, { user: null }],
    };

    const product = await Product.findOneAndUpdate(
      filter,
      req.body,
      { new: true, runValidators: true }
    );

    if (!product) {
      res.status(404).json({ message: 'Product not found or unauthorized' });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(400).json({ message: 'Failed to update product' });
  }
});

// Delete a product / device
app.delete('/api/products/:id', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const userId = req.user?.userId;
    const filter = {
      _id: req.params.id,
      $or: [{ user: userId }, { user: { $exists: false } }, { user: null }],
    };

    const product = await Product.findOneAndDelete(filter);

    if (!product) {
      res.status(404).json({ message: 'Product not found or unauthorized' });
      return;
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(400).json({ message: 'Failed to delete product' });
  }
});
// Start the server and connect to MongoDB
async function startServer() {
  app.listen(PORT, () => {
    console.log(`ProofKeep API running at http://localhost:${PORT}`);
  });

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('MONGODB_URI is missing from backend/.env');
    return;
  }

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log('MongoDB connected successfully!');
  } catch (error: unknown) {
    const err = error as Error;
    console.error('MongoDB connection error:', err.message);
    console.warn(
      'Notice: If using MongoDB Atlas, ensure your current IP address is added to the IP Access List in Atlas (Network Access -> Add IP -> Allow 0.0.0.0/0).'
    );
  }
}

startServer();

