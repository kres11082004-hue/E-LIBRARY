import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import usersRouter from "./users.js";
import booksRouter from "./books.js";
import importUrlRouter from "./import-url.js";
import reservationsRouter from "./reservations.js";
import mylistRouter from "./mylist.js";
import borrowRouter from "./borrow.js";
import monitoringRouter from "./monitoring.js";
import authorizedUsersRouter from "./authorized-users.js";
import reportsRouter from "./reports.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(booksRouter);
router.use(importUrlRouter);
router.use(reservationsRouter);
router.use(mylistRouter);
router.use(borrowRouter);
router.use(monitoringRouter);
router.use(authorizedUsersRouter);
router.use(reportsRouter);

export default router;
