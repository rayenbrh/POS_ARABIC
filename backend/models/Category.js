import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'اسم الفئة مطلوب'],
    unique: true,
    trim: true
  }
}, { timestamps: true });

export default mongoose.model('Category', categorySchema);