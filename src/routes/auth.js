import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js'; // adjust path if needed

const router = express.Router();

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
  try {
    console.log("BODY:", req.body);

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    console.log("USER:", user);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    console.log("HASH:", user.passwordHash);

    const ok = await bcrypt.compare(password, user.passwordHash);
    console.log("PASSWORD MATCH:", ok);

    if (!ok) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.json({ message: 'Login success' });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    res.status(500).json({
      message: 'Server error',
      error: err.message,
      stack: err.stack
    });
  }
});

router.post('/signup', async (req, res) => {
  try {
    const result = signupSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const { email, password, technicianName, employeeId } = result.data;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({ email, passwordHash, role: 'admin', technicianName, employeeId });

    res.status(201).json({ message: 'User created', user });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/seed-admin', async (req, res) => {
  const passwordHash = await bcrypt.hash('Admin123!', 10);

  const user = await User.create({
    email: 'admin@epiroc.local',
    passwordHash,
    role: 'admin'
  });

  res.json(user);
});

export default router;