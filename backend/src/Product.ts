import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  category: string;
  purchaseDate: string;
  warrantyMonths: number;
  icon: string;
  image?: string;
  user?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    category: {
      type: String,
      required: true,
      enum: ['Electronics', 'Accessories', 'Home appliances', 'Other'],
    },
    purchaseDate: {
      type: String,
      required: true,
    },
    warrantyMonths: {
      type: Number,
      required: true,
      min: 0,
    },
    icon: {
      type: String,
      default: '📦',
    },
    image: {
      type: String,
      default: '',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  { timestamps: true }
);

const Product = mongoose.model<IProduct>('Product', productSchema);

export default Product;
