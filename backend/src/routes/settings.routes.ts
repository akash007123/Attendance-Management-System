import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settings.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authorizeRoles } from "../middleware/role.middleware";
import { ROLES } from "../constants/roles";

const router = Router();

router.use(authenticate);

router.get("/", getSettings);
router.patch("/", authorizeRoles(ROLES.ADMIN), updateSettings);

export default router;
