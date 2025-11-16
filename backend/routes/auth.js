import express from 'express';
import { login, createUser, getAllUsers } from '../controllers/authController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);
router.post('/users', protect, authorize('admin'), createUser);
router.get('/users', protect, authorize('admin'), getAllUsers);

export default router;