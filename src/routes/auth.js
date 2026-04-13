import express from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js'; // adjust path if needed

router.post('/login', async (req, res) => {
  try {
    console.log('LOGIN HIT:', req.body);

    const result = loginSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid payload' });
    }

    const { email, password } = result.data;

    // 1. Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 2. Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // 3. Create token
    const token = jwt.sign(
      {
        sub: user._id.toString(),
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      success: true,
      token,
      user: {
        email: user.email,
        role: user.role,
        technicianName: user.technicianName,
        employeeId: user.employeeId
      }
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;