import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import booksRouter from "./books";
import importUrlRouter from "./import-url";
import reservationsRouter from "./reservations";
import mylistRouter from "./mylist";
import borrowRouter from "./borrow";
import monitoringRouter from "./monitoring";

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

export default router;
