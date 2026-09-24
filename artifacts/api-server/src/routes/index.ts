import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dashboardRouter from "./dashboard";
import medicinesRouter from "./medicines";
import tabletRouter from "./tablet";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dashboardRouter);
router.use(medicinesRouter);
router.use(tabletRouter);

export default router;
