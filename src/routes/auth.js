import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const router = express.Router();

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

console.log("JWT_SECRET:", process.env.JWT_SECRET);

router.post('/technician/login', async (req, res) => {
  try {
    console.log("=== TECHNICIAN LOGIN START ===");
    console.log("REQUEST BODY:", JSON.stringify(req.body, null, 2));
    console.log("REQUEST HEADERS:", JSON.stringify(req.headers, null, 2));
    console.log("REQUEST METHOD:", req.method);
    console.log("REQUEST URL:", req.url);

    if (!req.body) {
      console.error("ERROR: Missing request body");
      throw new Error("Missing request body");
    }

    const { name, employee_id, password } = req.body;
    console.log("EXTRACTED FIELDS - name:", name, "employee_id:", employee_id, "password:", password ? "***" : "MISSING");

    if (!name || !employee_id || !password) {
      console.error("ERROR: Missing required fields - name:", !!name, "employee_id:", !!employee_id, "password:", !!password);
      return res.status(400).json({ message: "Name, employee_id and password required" });
    }

    console.log("SEARCHING FOR USER WITH employeeId:", employee_id);
    const user = await User.findOne({ employeeId: employee_id });
    console.log("TECHNICIAN FOUND:", user ? "YES" : "NO");
    if (user) {
      console.log("USER DETAILS:", {
        id: user._id,
        email: user.email,
        role: user.role,
        technicianName: user.technicianName,
        employeeId: user.employeeId,
        hasPasswordHash: !!user.passwordHash
      });
    }

    if (!user) {
      console.error("ERROR: Technician not found with employeeId:", employee_id);
      return res.status(401).json({ message: "Technician not found" });
    }

    if (!user.passwordHash) {
      console.error("ERROR: Missing passwordHash in DB for user:", user._id);
      return res.status(500).json({ message: "Missing passwordHash in DB" });
    }

    console.log("COMPARING PASSWORD...");
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log("PASSWORD MATCH RESULT:", isMatch);

    if (!isMatch) {
      console.error("ERROR: Invalid password for user:", user._id);
      return res.status(401).json({ message: "Invalid password" });
    }

    console.log("CREATING JWT TOKEN...");
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    console.log("TOKEN CREATED SUCCESSFULLY");

    const response = {
      token,
      user: {
        email: user.email,
        role: user.role,
        technicianName: user.technicianName,
        employeeId: user.employeeId
      }
    };
    console.log("TECHNICIAN LOGIN SUCCESS - Sending response");
    console.log("=== TECHNICIAN LOGIN END ===");

    return res.json(response);

  } catch (err) {
    console.error("=== TECHNICIAN LOGIN ERROR ===");
    console.error("ERROR TYPE:", err.constructor.name);
    console.error("ERROR MESSAGE:", err.message);
    console.error("ERROR STACK:", err.stack);
    console.error("=== END TECHNICIAN LOGIN ERROR ===");
    
    return res.status(500).json({
      message: "TECHNICIAN LOGIN FAILED",
      error: err.message,
      stack: err.stack
    });
  }
});

router.post('/supervisor/login', async (req, res) => {
  try {
    console.log("=== SUPERVISOR LOGIN START ===");
    console.log("REQUEST BODY:", JSON.stringify(req.body, null, 2));
    console.log("REQUEST HEADERS:", JSON.stringify(req.headers, null, 2));
    console.log("REQUEST METHOD:", req.method);
    console.log("REQUEST URL:", req.url);

    if (!req.body) {
      console.error("ERROR: Missing request body");
      throw new Error("Missing request body");
    }

    const { code } = req.body;
    console.log("EXTRACTED FIELDS - code:", code);

    if (!code) {
      console.error("ERROR: Missing required field - code:", !!code);
      return res.status(400).json({ message: "Code required" });
    }

    console.log("SEARCHING FOR USER WITH supervisorCode:", code);
    const user = await User.findOne({ supervisorCode: code });
    console.log("SUPERVISOR FOUND:", user ? "YES" : "NO");
    if (user) {
      console.log("USER DETAILS:", {
        id: user._id,
        email: user.email,
        role: user.role,
        supervisorCode: user.supervisorCode,
        hasPasswordHash: !!user.passwordHash
      });
    }

    if (!user) {
      console.error("ERROR: Supervisor not found with supervisorCode:", code);
      return res.status(401).json({ message: "Supervisor not found" });
    }

    console.log("CREATING JWT TOKEN...");
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    console.log("TOKEN CREATED SUCCESSFULLY");

    const response = {
      token,
      user: {
        email: user.email,
        role: user.role
      }
    };
    console.log("SUPERVISOR LOGIN SUCCESS - Sending response");
    console.log("=== SUPERVISOR LOGIN END ===");

    return res.json(response);

  } catch (err) {
    console.error("=== SUPERVISOR LOGIN ERROR ===");
    console.error("ERROR TYPE:", err.constructor.name);
    console.error("ERROR MESSAGE:", err.message);
    console.error("ERROR STACK:", err.stack);
    console.error("=== END SUPERVISOR LOGIN ERROR ===");
    
    return res.status(500).json({
      message: "SUPERVISOR LOGIN FAILED",
      error: err.message,
      stack: err.stack
    });
  }
});

router.post('/login', async (req, res) => {
  try {
    console.log("=== MANAGER LOGIN START ===");
    console.log("REQUEST BODY:", JSON.stringify(req.body, null, 2));
    console.log("REQUEST HEADERS:", JSON.stringify(req.headers, null, 2));
    console.log("REQUEST METHOD:", req.method);
    console.log("REQUEST URL:", req.url);

    if (!req.body) {
      console.error("ERROR: Missing request body");
      throw new Error("Missing request body");
    }

    const { email, password } = req.body;
    console.log("EXTRACTED FIELDS - email:", email, "password:", password ? "***" : "MISSING");

    if (!email || !password) {
      console.error("ERROR: Missing required fields - email:", !!email, "password:", !!password);
      return res.status(400).json({ message: "Email and password required" });
    }

    console.log("SEARCHING FOR USER WITH email:", email.toLowerCase());
    const user = await User.findOne({ email: email.toLowerCase() });
    console.log("MANAGER FOUND:", user ? "YES" : "NO");
    if (user) {
      console.log("USER DETAILS:", {
        id: user._id,
        email: user.email,
        role: user.role,
        hasPasswordHash: !!user.passwordHash
      });
    }

    if (!user) {
      console.error("ERROR: Manager not found with email:", email);
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.passwordHash) {
      console.error("ERROR: Missing passwordHash in DB for user:", user._id);
      return res.status(500).json({ message: "Missing passwordHash in DB" });
    }

    console.log("COMPARING PASSWORD...");
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log("PASSWORD MATCH RESULT:", isMatch);

    if (!isMatch) {
      console.error("ERROR: Invalid password for user:", user._id);
      return res.status(401).json({ message: "Invalid password" });
    }

    console.log("CREATING JWT TOKEN...");
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    console.log("TOKEN CREATED SUCCESSFULLY");

    const response = {
      token,
      user: {
        email: user.email,
        role: user.role
      }
    };
    console.log("MANAGER LOGIN SUCCESS - Sending response");
    console.log("=== MANAGER LOGIN END ===");

    return res.json(response);

  } catch (err) {
    console.error("=== MANAGER LOGIN ERROR ===");
    console.error("ERROR TYPE:", err.constructor.name);
    console.error("ERROR MESSAGE:", err.message);
    console.error("ERROR STACK:", err.stack);
    console.error("=== END MANAGER LOGIN ERROR ===");
    
    return res.status(500).json({
      message: "LOGIN FAILED",
      error: err.message,
      stack: err.stack
    });
  }
});

router.get('/seed-admin', async (req, res) => {
  try {
    const passwordHash = await bcrypt.hash('Admin123!', 10);

    const user = await User.create({
      email: 'admin@epiroc.local',
      passwordHash,
      role: 'admin'
    });

    res.json(user);
  } catch (err) {
    console.error("SEED ERROR:", err);
    return res.status(500).json({
      message: "SEED FAILED",
      error: err.message
    });
  }
});

router.get('/seed-supervisor', async (req, res) => {
  try {
    const passwordHash = await bcrypt.hash('Supervisor123!', 10);

    const user = await User.create({
      email: 'supervisor@epiroc.local',
      passwordHash,
      role: 'Supervisor',
      supervisorCode: 'SUP001'
    });

    res.json(user);
  } catch (err) {
    console.error("SEED SUPERVISOR ERROR:", err);
    return res.status(500).json({
      message: "SEED SUPERVISOR FAILED",
      error: err.message
    });
  }
});

router.get('/seed-manager', async (req, res) => {
  try {
    const passwordHash = await bcrypt.hash('Admin123!', 10);

    const user = await User.create({
      email: 'admin@epiroc.local',
      passwordHash,
      role: 'Manager'
    });

    res.json(user);
  } catch (err) {
    console.error("SEED MANAGER ERROR:", err);
    return res.status(500).json({
      message: "SEED MANAGER FAILED",
      error: err.message
    });
  }
});

router.get('/fix-supervisor', async (req, res) => {
  try {
    // Find existing supervisor and add missing supervisorCode
    const user = await User.findOneAndUpdate(
      { email: 'supervisor@epiroc.local' },
      { 
        supervisorCode: 'SUP001',
        role: 'Supervisor'
      },
      { new: true, upsert: true }
    );

    if (!user.passwordHash) {
      const passwordHash = await bcrypt.hash('Supervisor123!', 10);
      user.passwordHash = passwordHash;
      await user.save();
    }

    console.log("FIXED SUPERVISOR:", user);
    res.json({ message: "Supervisor fixed successfully", user: {
      email: user.email,
      role: user.role,
      supervisorCode: user.supervisorCode,
      hasPasswordHash: !!user.passwordHash
    }});
  } catch (err) {
    console.error("FIX SUPERVISOR ERROR:", err);
    return res.status(500).json({
      message: "FIX SUPERVISOR FAILED",
      error: err.message
    });
  }
});

router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes working' });
});

export default router;