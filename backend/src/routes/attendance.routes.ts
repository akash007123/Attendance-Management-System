import { Router } from "express";
import {
  punchIn,
  punchOut,
  getTodayAttendance,
  getAttendanceList,
  getAttendanceById,
  validateAttendance,
  resetToday,
} from "../controllers/attendance.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { ROLES } from "../constants/roles";

const router = Router();

router.use(authenticate);

router.get("/today", getTodayAttendance);
router.post("/punch-in", punchIn);
router.post("/punch-out", punchOut);
router.get("/", getAttendanceList);
router.get("/:id", getAttendanceById);
router.patch("/:id/validation", authorizeRoles(ROLES.ADMIN, ROLES.MANAGER), validateAttendance);
router.post("/reset-today", resetToday);

export default router;
