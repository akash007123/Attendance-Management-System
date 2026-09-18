import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { User } from "../models/user.model";
import { AuditLog } from "../models/auditLog.model";

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const query: any = {};
    const { department, role, search } = req.query;

    if (department && department !== "ALL") {
      query.department = String(department);
    }
    if (role && role !== "ALL") {
      query.role = String(role);
    }
    if (search) {
      const q = String(search).trim();
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { designation: { $regex: q, $options: "i" } },
      ];
    }

    const users = await User.find(query).sort({ name: 1 });

    return res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserById(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = await User.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
}

export async function createUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { name, email, role, department, designation, phone, managerId, managerName } = req.body;

    if (!name || !email || !role || !department || !designation) {
      return res.status(400).json({
        success: false,
        message: "Name, email, role, department, and designation are required.",
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "A user with this email address already exists.",
      });
    }

    const newUser = await User.create({
      name,
      email,
      password: "password123",
      role,
      department,
      designation,
      phone: phone || "",
      managerId: managerId || undefined,
      managerName: managerName || undefined,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      status: "ACTIVE",
    });

    await AuditLog.create({
      userId: req.user?.id || "system",
      userName: req.user?.name || "Admin",
      userRole: req.user?.role || "ADMIN",
      action: "USER_CREATED",
      targetEntity: "User",
      targetId: newUser.id,
      details: { email, role, department },
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await User.findOne({
      $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { id }],
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    Object.assign(user, updates);
    if (updates.status) {
      user.isActive = updates.status === "ACTIVE";
    }

    await user.save();

    return res.json({
      success: true,
      message: "User updated successfully.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
}
