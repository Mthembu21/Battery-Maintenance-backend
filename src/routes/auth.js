import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    console.log("LOGIN BODY:", req.body);

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    console.log("FOUND USER:", user);

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.passwordHash) {
      return res.status(500).json({ message: 'Missing passwordHash in DB' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log("PASSWORD MATCH:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    return res.json({
      token,
      user: {
        email: user.email,
        role: user.role
      }
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);

    return res.status(500).json({
      message: 'Server error',
      error: err.message
    });
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