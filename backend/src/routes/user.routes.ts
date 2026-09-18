import { Router } from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
} from "../controllers/user.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { ROLES } from "../constants/roles";

const router = Router();

router.use(authenticate);

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", authorizeRoles(ROLES.ADMIN), createUser);
router.patch("/:id", authorizeRoles(ROLES.ADMIN), updateUser);

export default router;
