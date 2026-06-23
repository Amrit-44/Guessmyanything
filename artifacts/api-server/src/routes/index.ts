import { Router, type IRouter } from "express";
import healthRouter from "./health";
import gameRouter from "./game";
import ageRouter from "./age";
import categoriesRouter from "./categories";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/game", gameRouter);
router.use("/age", ageRouter);
router.use("/categories", categoriesRouter);
router.use("/admin", adminRouter);

export default router;
