import express from 'express';
import {
  getFinancialReport,
  getLowStockReport,
  getSalesByProduct,
  getProductHistory,
  getCapitalAnalysis
} from '../controllers/reportController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.get('/financials', protect, authorize('admin'), getFinancialReport);
router.get('/low-stock', protect, getLowStockReport);
router.get('/sales-by-product', protect, authorize('admin'), getSalesByProduct);
router.get('/product-history/:productId', protect, authorize('admin'), getProductHistory);
router.get('/capital-analysis', protect, authorize('admin'), getCapitalAnalysis);

export default router;