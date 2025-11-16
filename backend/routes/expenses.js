import express from 'express';
import {
  createExpense,
  getAllExpenses,
  deleteExpense
} from '../controllers/expenseController.js';
import { protect } from '../middlewares/auth.js';

const router = express.Router();

router.post('/', protect, createExpense);
router.get('/', protect, getAllExpenses);
router.delete('/:id', protect, deleteExpense);

export default router;