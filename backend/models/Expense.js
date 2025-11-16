import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: [true, 'المبلغ مطلوب'],
    min: 0
  },
  reasonArabic: {
    type: String,
    required: [true, 'السبب مطلوب'],
    trim: true
  },
  takenFrom: {
    type: String,
    default: 'caisse'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, { timestamps: true });

export default mongoose.model('Expense', expenseSchema);