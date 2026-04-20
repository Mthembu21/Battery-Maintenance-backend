import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { Battery } from '../models/Battery.js';
import { MaintenanceRecord } from '../models/MaintenanceRecord.js';
import { getWeekKey } from '../utils/week.js';

const router = Router();

const uploadDir = path.resolve(process.cwd(), 'uploads');
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'application/pdf') return cb(new Error('Only PDF allowed'));
    cb(null, true);
  },
  limits: { fileSize: 15 * 1024 * 1024 }
});

const createSchema = z.object({
  technicianName: z.string().min(1),
  customerSite: z.string().min(1),
  assetId: z.string().min(1),
  assetType: z.enum(['Charger', 'B2 Battery', 'B4 Battery', 'B5 Battery']),
  serialNumber: z.string().min(1),
  maintenanceDate: z.coerce.date(),
  maintenanceType: z.string().min(1),
  notes: z.string().optional().default('')
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const { customer, site, assetType, assetId, technician, from, to, serialNumber, customerSite } = req.query;
    const filter = {};
    
    if (customer) filter.customerName = customer;
    if (site) filter.site = site;
    if (assetType) filter.assetType = assetType;
    if (assetId) filter.assetId = assetId;
    if (technician) filter.technicianName = technician;
    if (serialNumber) filter.serialNumber = serialNumber;
    
    // Handle combined customerSite filter
    if (customerSite && !customer && !site) {
      const [customerPart, sitePart] = customerSite.split('/').map(s => s.trim());
      if (customerPart) filter.customerName = { $regex: customerPart, $options: 'i' };
      if (sitePart) filter.site = { $regex: sitePart, $options: 'i' };
    }
    
    if (from || to) {
      filter.maintenanceDate = {};
      if (from) filter.maintenanceDate.$gte = new Date(from);
      if (to) filter.maintenanceDate.$lte = new Date(to);
    }

    const rows = await MaintenanceRecord.find(filter).sort({ maintenanceDate: -1 }).limit(500);
    return res.json(rows);
  } catch (error) {
    console.error('Error fetching maintenance records:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/', requireAuth, requireRole('Technician', 'Supervisor'), upload.single('pdf'), async (req, res) => {
  try {
    console.log("=== MAINTENANCE SUBMISSION START ===");
    console.log("REQUEST BODY:", JSON.stringify(req.body, null, 2));
    console.log("REQUEST FILE:", req.file ? req.file.originalname : 'No file');
    
    const parsed = createSchema.safeParse(req.body);
    console.log("VALIDATION RESULT:", JSON.stringify(parsed, null, 2));
    
    if (!parsed.success) {
      console.log("VALIDATION FAILED:", parsed.error);
      return res.status(400).json({ message: 'Invalid payload', error: parsed.error });
    }
    if (!req.file) return res.status(400).json({ message: 'PDF is required' });

    const asset = await Battery.findOne({ assetId: parsed.data.assetId });
    if (!asset) return res.status(400).json({ message: 'Asset not found' });

    // Handle customerSite field - split into customerName and site for storage
    let customerName = '';
    let site = '';
    if (parsed.data.customerSite) {
      const [customerPart, sitePart] = parsed.data.customerSite.split('/').map(s => s.trim());
      customerName = customerPart || 'Unknown Customer';
      site = sitePart || 'Unknown Site';
    }

    const weekKey = getWeekKey(parsed.data.maintenanceDate);
    const fileUrl = `${process.env.PUBLIC_BASE_URL}/api/files/${req.file.filename}`;

    const record = await MaintenanceRecord.create({
      ...parsed.data,
      customerName,
      site,
      asset: asset._id,
      weekKey,
      pdf: {
        fileName: req.file.originalname,
        fileUrl,
        uploadedAt: new Date()
      }
    });

    await Battery.updateOne({ _id: asset._id }, { $set: { status: 'Active' } });

    return res.status(201).json(record);
  } catch (error) {
    console.error('Error creating maintenance record:', error);
    
    // Handle duplicate key error for battery+weekKey
    if (error.code === 11000 && error.keyPattern?.battery && error.keyPattern?.weekKey) {
      return res.status(400).json({ message: 'Maintenance record already exists for this battery this week' });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
