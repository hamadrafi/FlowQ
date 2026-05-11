import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  type: 'hospital' | 'govt' | 'salon' | 'bank' | 'education' | 'other';
  location?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema: Schema<IOrganization> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Organization type is required'],
      enum: {
        values: ['hospital', 'govt', 'salon', 'bank', 'education', 'other'],
        message: '{VALUE} is not a valid organization type',
      },
    },
    location: {
      type: String,
      trim: true,
    },
    ownerId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const Organization: Model<IOrganization> =
  mongoose.models.Organization || mongoose.model<IOrganization>('Organization', OrganizationSchema);

export default Organization;
