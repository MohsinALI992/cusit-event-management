import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import eventsRouter from "./events";
import registrationsRouter from "./registrations";
import attendanceRouter from "./attendance";
import certificatesRouter from "./certificates";
import notificationsRouter from "./notifications";
import feedbackRouter from "./feedback";
import reportsRouter from "./reports";
import openaiRouter from "./openai";
import aiRouter from "./ai";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(eventsRouter);
router.use(registrationsRouter);
router.use(attendanceRouter);
router.use(certificatesRouter);
router.use(notificationsRouter);
router.use(feedbackRouter);
router.use(reportsRouter);
router.use(openaiRouter);
router.use(aiRouter);

export default router;
