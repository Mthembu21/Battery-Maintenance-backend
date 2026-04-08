import mongoose from 'mongoose';

const BatterySchema = new mongoose.Schema(
  {
    assetId: { type: String, required: true, unique: true, trim: true },
    assetType: { type: String, required: true, trim: true, enum: ['Charger', 'B2 Battery', 'B4 Battery', 'B5 Battery'] },
    serialNumber: { type: String, required: true, trim: true },
    customerSite: { type: String, required: true, trim: true },
    customer: { type: String, required: true, trim: true },
    site: { type: String, required: true, trim: true },

    locationType: {
      type: String,
      required: true,
      enum: ['On Customer Site', 'Workshop']
    },
    workshopName: { type: String, default: '' },

    status: {
      type: String,
      required: true,
      enum: ['Active', 'Inactive', 'Missed Service'],
      default: 'Active'
    },
    notes: { type: String, default: '' }
  },
  { timestamps: true }
);

BatterySchema.index({ customerSite: 1 });

export const Battery = mongoose.model('Battery', BatterySchema);
