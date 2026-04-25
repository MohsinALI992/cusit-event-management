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

export default router;
