import express from 'express';
import {
  createSale,
  getAllSales,
  getSale,
  deleteSale,
  getDeletedSales
} from '../controllers/saleController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, createSale);
router.get('/', protect, getAllSales);
router.get('/deleted', protect, authorize('admin'), getDeletedSales);
router.get('/:id', protect, getSale);
router.delete('/:id', protect, deleteSale);

export default router;