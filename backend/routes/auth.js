import express from 'express';
import { login, createUser, getAllUsers } from '../controllers/authController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { createLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Login without rate limiter
router.post('/login', login);
router.post('/users', protect, authorize('admin'), createLimiter, createUser);
router.get('/users', protect, authorize('admin'), getAllUsers);

export default router;
