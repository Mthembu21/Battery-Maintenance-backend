import { Router } from 'express';
import { z } from 'zod';
import { Battery } from '../models/Battery.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

const batterySchema = z.object({
  customerSite: z.string().min(1),
  assetId: z.string().min(1),
  assetType: z.enum(['Charger', 'B2 Battery', 'B4 Battery', 'B5 Battery']),
  serialNumber: z.string().min(1),
  locationType: z.enum(['On Customer Site', 'Workshop']),
  workshopName: z.string().optional().default(''),
  status: z.enum(['Active', 'Inactive', 'Missed Service']).optional().default('Active'),
  notes: z.string().optional().default('')
});

router.get('/', requireAuth, async (req, res) => {
  const { customer, site, assetType, assetId, serialNumber, customerSite } = req.query;
  const filter = {};
  
  if (customer) filter.customerSite = customer;
  if (site) filter.customerSite = site;
  if (assetType) filter.assetType = assetType;
  if (assetId) filter.assetId = assetId;
  if (serialNumber) filter.serialNumber = serialNumber;
  
  // Handle combined customerSite filter
  if (customerSite && !customer && !site) {
    const [customerPart, sitePart] = customerSite.split('/').map(s => s.trim());
    if (customerPart) filter.customerSite = { $regex: customerPart, $options: 'i' };
    if (sitePart) filter.customerSite = { $regex: sitePart, $options: 'i' };
  }

  const batteries = await Battery.find(filter).sort({ createdAt: -1 }).limit(500);
  return res.json(batteries);
});

router.post('/', requireAuth, requireRole('Supervisor'), async (req, res) => {
  try {
    const parsed = batterySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

    // Handle customerSite field - split into customer and site
    let customer = '';
    let site = '';
    if (parsed.data.customerSite) {
      const [customerPart, sitePart] = parsed.data.customerSite.split('/').map(s => s.trim());
      customer = customerPart || 'Unknown Customer';
      site = sitePart || 'Unknown Site';
    } else {
      customer = 'Unknown Customer';
      site = 'Unknown Site';
    }

    const batteryData = {
      ...parsed.data,
      customer,
      site
    };

    const created = await Battery.create(batteryData);
    return res.status(201).json(created);
  } catch (error) {
    console.error('Error creating battery:', error);
    
    // Handle duplicate key error for assetId
    if (error.code === 11000 && error.keyPattern?.assetId) {
      return res.status(400).json({ message: 'Asset ID already exists' });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:id', requireAuth, requireRole('Supervisor'), async (req, res) => {
  const updated = await Battery.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  return res.json(updated);
});

export default router;
