import mongoose from 'mongoose';

const PdfSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    uploadedAt: { type: Date, required: true }
  },
  { _id: false }
);

const MaintenanceRecordSchema = new mongoose.Schema(
  {
    asset: { type: mongoose.Schema.Types.ObjectId, ref: 'Battery', required: true },

    technicianName: { type: String, required: true, trim: true },

    customerName: { type: String, required: true, trim: true },
    site: { type: String, required: true, trim: true },

    assetId: { type: String, required: true, trim: true },
    assetType: { type: String, required: true, trim: true, enum: ['Charger', 'B2 Battery', 'B4 Battery', 'B5 Battery'] },
    serialNumber: { type: String, required: true, trim: true },

    maintenanceDate: { type: Date, required: true },
    maintenanceType: { type: String, required: true, trim: true },
    notes: { type: String, default: '' },

    pdf: { type: PdfSchema, required: true },

    weekKey: { type: String, required: true }
  },
  { timestamps: true }
);

MaintenanceRecordSchema.index({ battery: 1, weekKey: 1 }, { unique: true });
MaintenanceRecordSchema.index({ maintenanceDate: -1 });
MaintenanceRecordSchema.index({ customerName: 1, site: 1 });
MaintenanceRecordSchema.index({ technicianName: 1 });

export const MaintenanceRecord = mongoose.model('MaintenanceRecord', MaintenanceRecordSchema);
