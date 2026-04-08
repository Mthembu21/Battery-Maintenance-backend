import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { User } from '../models/User.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  technicianName: z.string().min(2),
  employeeId: z.string().min(2)
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

  const { email, password } = parsed.data;
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  return res.json({ 
    token, 
    user: { 
      email: user.email, 
      role: user.role,
      technicianName: user.technicianName,
      employeeId: user.employeeId
    } 
  });
});

router.post('/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Invalid payload' });

  const { email, password, technicianName, employeeId } = parsed.data;

  // Check if email already exists
  const existingEmail = await User.findOne({ email: email.toLowerCase() });
  if (existingEmail) return res.status(400).json({ message: 'Email already registered' });

  // Check if employee ID already exists
  const existingEmployeeId = await User.findOne({ employeeId });
  if (existingEmployeeId) return res.status(400).json({ message: 'Employee ID already registered' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ 
    email: email.toLowerCase(), 
    passwordHash, 
    role: 'Technician',
    technicianName,
    employeeId
  });

  const token = jwt.sign(
    { sub: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  return res.json({ 
    token, 
    user: { 
      email: user.email, 
      role: user.role,
      technicianName: user.technicianName,
      employeeId: user.employeeId
    } 
  });
});

router.post('/seed-admin', async (req, res) => {
  const existing = await User.findOne({ email: 'admin@epiroc.local' });
  if (existing) return res.json({ message: 'Already seeded' });

  const passwordHash = await bcrypt.hash('Admin123!', 10);
  await User.create({ email: 'admin@epiroc.local', passwordHash, role: 'Supervisor' });
  return res.json({ message: 'Seeded admin@epiroc.local / Admin123!' });
});

router.post('/seed-manager', async (req, res) => {
  const existing = await User.findOne({ email: 'manager@epiroc.local' });
  if (existing) return res.json({ message: 'Already seeded' });

  const passwordHash = await bcrypt.hash('Manager123!', 10);
  await User.create({ email: 'manager@epiroc.local', passwordHash, role: 'Manager' });
  return res.json({ message: 'Seeded manager@epiroc.local / Manager123!' });
});

export default router;
