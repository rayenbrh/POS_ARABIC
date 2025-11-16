import express from 'express';
import { moveStock, getStockMovements } from '../controllers/stockController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.post('/move', protect, authorize('admin'), moveStock);
router.get('/movements', protect, getStockMovements);

export default router;