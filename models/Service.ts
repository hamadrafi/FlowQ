import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IService extends Document {
  orgId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  estimatedTime?: number; // in minutes
  isActive: boolean;
  totalCustomersServed: number;
  averageWaitTime: number; // rolling average in minutes
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSchema: Schema<IService> = new Schema(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    estimatedTime: {
      type: Number,
      min: [0, 'Estimated time cannot be negative'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    totalCustomersServed: {
      type: Number,
      default: 0,
    },
    averageWaitTime: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Service: Model<IService> =
  mongoose.models.Service || mongoose.model<IService>('Service', ServiceSchema);

export default Service;
