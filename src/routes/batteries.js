import { Router } from 'express';
import { z } from 'zod';
import { Battery } from '../models/Battery.js';
import { MaintenanceRecord } from '../models/MaintenanceRecord.js';
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

    const batteryData = {
      ...parsed.data,
      customer: parsed.data.customerSite || 'Unknown',
      site: parsed.data.customerSite || 'Unknown'
    };

    const created = await Battery.create(batteryData);
    return res.status(201).json(created);
  } catch (error) {
    console.error('Error creating battery:', error);
    
    // Handle duplicate key error for assetId
    if (error.code === 11000 && error.keyPattern?.assetId) {
      const duplicateAssetId = error.keyValue?.assetId || 'Unknown';
      console.log(`DUPLICATE ASSET ID ERROR: ${duplicateAssetId}`);
      return res.status(400).json({ 
        message: 'Asset ID already exists', 
        duplicateAssetId,
        suggestion: `Please use a different Asset ID. Asset ID "${duplicateAssetId}" is already in use.`
      });
    }
    
    return res.status(500).json({ message: 'Internal server error' });
  }
});

router.patch('/:id', requireAuth, requireRole('Supervisor'), async (req, res) => {
  const updated = await Battery.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!updated) return res.status(404).json({ message: 'Not found' });
  return res.json(updated);
});

router.delete('/:id', requireAuth, requireRole('Supervisor', 'Manager'), async (req, res) => {
  const { id } = req.params;
  
  // Find the battery first to get details for logging
  const battery = await Battery.findById(id);
  if (!battery) return res.status(404).json({ message: 'Battery not found' });
  
  try {
    // Delete all maintenance records associated with this battery
    const deletedMaintenanceRecords = await MaintenanceRecord.deleteMany({ asset: id });
    
    // Delete the battery
    const deletedBattery = await Battery.findByIdAndDelete(id);
    
    if (!deletedBattery) return res.status(404).json({ message: 'Battery not found' });
    
    return res.json({ 
      message: 'Battery and all associated maintenance records deleted successfully',
      battery: deletedBattery,
      deletedMaintenanceRecordsCount: deletedMaintenanceRecords.deletedCount
    });
  } catch (error) {
    console.error('Error deleting battery:', error);
    return res.status(500).json({ message: 'Failed to delete battery' });
  }
});

export default router;
