import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, required: true, enum: ['Technician', 'Supervisor', 'Manager'] },
    technicianName: { type: String, required: function() { return this.role === 'Technician'; } },
    employeeId: { type: String, required: function() { return this.role === 'Technician'; }, unique: true, sparse: true },
    supervisorCode: { type: String, required: function() { return this.role === 'Supervisor'; }, unique: true, sparse: true }
  },
  { timestamps: true }
);

export const User = mongoose.model('User', UserSchema);
