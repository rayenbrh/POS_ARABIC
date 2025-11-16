import express from 'express';
import { login, createUser, getAllUsers } from '../controllers/authController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { authLimiter, createLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Apply rate limiters to protect against brute force attacks
router.post('/login', authLimiter, login);
router.post('/users', protect, authorize('admin'), createLimiter, createUser);
router.get('/users', protect, authorize('admin'), getAllUsers);

export default router;