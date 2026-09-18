import { Router } from "express";
import {
  createOvertimeRequest,
  getOvertimeRequests,
  approveOvertime,
  rejectOvertime,
} from "../controllers/overtime.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { ROLES } from "../constants/roles";

const router = Router();

router.use(authenticate);

router.post("/", createOvertimeRequest);
router.get("/", getOvertimeRequests);
router.patch("/:id/approve", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), approveOvertime);
router.patch("/:id/reject", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), rejectOvertime);

export default router;
