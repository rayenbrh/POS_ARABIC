import mongoose from 'mongoose';

const stockMovementSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  qtyChangeBaseUnit: {
    type: Number,
    required: true
  },
  baseUnitType: {
    type: String,
    enum: ['grams', 'pieces'],
    required: true
  },
  type: {
    type: String,
    enum: ['in', 'out', 'adjustment'],
    required: true
  },
  reason: {
    type: String,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  relatedSaleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  }
}, { timestamps: true });

export default mongoose.model('StockMovement', stockMovementSchema);