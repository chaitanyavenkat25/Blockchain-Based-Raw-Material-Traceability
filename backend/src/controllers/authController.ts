import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User, IUser } from "../models/User";
import { Supplier } from "../models/Supplier";
import { AuditLog } from "../models/AuditLog";
import { config } from "../config";
import { registerSchema, loginSchema } from "../validators";
import { AuthenticatedRequest } from "../middleware/authMiddleware";

export const register = async (req: Request, res: Response) => {
  const validated = registerSchema.parse(req.body);

  const existing = await User.findOne({ email: validated.email });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: "An account with this email address already exists.",
    });
  }

  const user = new User({
    name: validated.name,
    email: validated.email,
    password: validated.password,
    role: validated.role,
    organization: validated.organization,
    ethereumAddress: validated.ethereumAddress,
    phone: validated.phone,
    status: validated.role === "SUPPLIER" ? "PENDING_APPROVAL" : "ACTIVE",
  });

  await user.save();

  // If supplier role, create Supplier profile
  if (validated.role === "SUPPLIER" && validated.supplierProfile) {
    await Supplier.create({
      userId: user._id,
      companyName: validated.supplierProfile.companyName,
      registrationNumber: validated.supplierProfile.registrationNumber,
      country: validated.supplierProfile.country,
      region: validated.supplierProfile.region,
      facilityType: validated.supplierProfile.facilityType,
      sourcingCategories: validated.supplierProfile.sourcingCategories,
      complianceStatus: "PENDING_APPROVAL",
    });
  }

  await AuditLog.create({
    action: "USER_REGISTERED",
    actorId: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    targetResource: "User",
    targetId: user._id.toString(),
    details: { role: user.role, organization: user.organization },
  });

  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  return res.status(201).json({
    success: true,
    message:
      user.role === "SUPPLIER"
        ? "Supplier registration submitted. Account is pending administrator approval."
        : "Registration successful.",
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        status: user.status,
        ethereumAddress: user.ethereumAddress,
      },
    },
  });
};

export const login = async (req: Request, res: Response) => {
  const validated = loginSchema.parse(req.body);

  const user = await User.findOne({ email: validated.email });
  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  }

  const isMatch = await user.comparePassword(validated.password);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  }

  if (user.status === "REJECTED") {
    return res.status(403).json({
      success: false,
      message: "Your account registration has been rejected by an administrator.",
    });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  await AuditLog.create({
    action: "USER_LOGIN",
    actorId: user._id,
    actorEmail: user.email,
    actorRole: user.role,
    targetResource: "User",
    targetId: user._id.toString(),
    details: { loginAt: new Date() },
  });

  return res.json({
    success: true,
    message: "Login successful.",
    data: {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        status: user.status,
        ethereumAddress: user.ethereumAddress,
      },
    },
  });
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let supplierProfile = null;
  if (user.role === "SUPPLIER") {
    supplierProfile = await Supplier.findOne({ userId: user._id });
  }

  return res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        status: user.status,
        ethereumAddress: user.ethereumAddress,
        createdAt: user.createdAt,
      },
      supplierProfile,
    },
  });
};
