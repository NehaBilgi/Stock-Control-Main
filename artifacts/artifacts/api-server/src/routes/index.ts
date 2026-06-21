import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import locationsRouter from "./locations";
import productsRouter from "./products";
import transactionsRouter from "./transactions";
import equipmentRouter from "./equipment";
import dashboardRouter from "./dashboard";
import alertsRouter from "./alerts";
import reportsRouter from "./reports";
import reordersRouter from "./reorders";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/categories", categoriesRouter);
router.use("/locations", locationsRouter);
router.use("/products", productsRouter);
router.use("/transactions", transactionsRouter);
router.use("/equipment", equipmentRouter);
router.use("/dashboard", dashboardRouter);
router.use("/alerts", alertsRouter);
router.use("/reports", reportsRouter);
router.use("/reorders", reordersRouter);
router.use("/users", usersRouter);

export default router;
