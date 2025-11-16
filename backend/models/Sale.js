import mongoose from 'mongoose';

const saleSchema = new mongoose.Schema({
  cashierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    qtyBaseUnit: {
      type: Number,
      required: true
    },
    baseUnitType: {
      type: String,
      enum: ['grams', 'pieces'],
      required: true
    },
    unitPrice: {
      type: Number,
      required: true
    },
    subtotal: {
      type: Number,
      required: true
    }
  }],
  total: {
    type: Number,
    required: true
  },
  amountGiven: {
    type: Number,
    default: 0
  },
  changeReturned: {
    type: Number,
    default: 0
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  deletedAt: {
    type: Date
  }
}, { timestamps: true });

export default mongoose.model('Sale', saleSchema);