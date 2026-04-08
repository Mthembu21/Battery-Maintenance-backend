import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/:filename', requireAuth, async (req, res) => {
  const filePath = path.resolve(process.cwd(), 'uploads', req.params.filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: 'Not found' });
  return res.sendFile(filePath);
});

export default router;
