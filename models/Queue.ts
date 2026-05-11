import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer {
  name: string;
  phone?: string;
  status: 'waiting' | 'called' | 'completed' | 'skipped';
  position: number;
  joinedAt: Date;
  calledAt?: Date;
  completedAt?: Date;
  transferredFrom?: string;
}

export interface IQueue extends Document {
  serviceId: mongoose.Types.ObjectId;
  orgId: mongoose.Types.ObjectId;
  customers: ICustomer[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema<ICustomer> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['waiting', 'called', 'completed', 'skipped', 'transferred'],
      default: 'waiting',
    },
    position: {
      type: Number,
      required: [true, 'Customer position is required'],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    calledAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    transferredFrom: {
      type: String,
    },
  },
  { _id: true } // Each customer in the array gets a unique ID for easier manipulation
);

const QueueSchema: Schema<IQueue> = new Schema(
  {
    serviceId: {
      type: Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service ID is required'],
    },
    orgId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
    },
    customers: [CustomerSchema],
  },
  {
    timestamps: true,
  }
);

// Indexing for faster lookups
QueueSchema.index({ serviceId: 1 });
QueueSchema.index({ orgId: 1 });

const Queue: Model<IQueue> =
  mongoose.models.Queue || mongoose.model<IQueue>('Queue', QueueSchema);

export default Queue;
