import { router } from "../../../trpc";
import attendanceRouter from "./attendance";
import directoryRouter from "./directory";
import enrollmentPaymentsRouter from "./enrollment-payments";
import enrollmentsRouter from "./enrollments";
import financialRouter from "./financial";
import instructorRouter from "./instructor";
import kioskRouter from "./kiosk";
import leadsRouter from "./directory";
import makeupRouter from "./makeup";
import managerRouter from "./manager";
import messagingRouter from "./messaging";
import progressNotesRouter from "./progress-notes";
import skillsRouter from "./skills";
import swimNotificationsRouter from "./swim-notifications";
import swimmersRouter from "./swimmers";
import waitlistRouter from "./waitlist";

export const swimRouter = router({
  swimmers: swimmersRouter,
  enrollments: enrollmentsRouter,
  enrollmentPayments: enrollmentPaymentsRouter,
  attendance: attendanceRouter,
  progressNotes: progressNotesRouter,
  instructor: instructorRouter,
  manager: managerRouter,
  notifications: swimNotificationsRouter,
  waitlist: waitlistRouter,
  financial: financialRouter,
  messaging: messagingRouter,
  kiosk: kioskRouter,
  makeup: makeupRouter,
  skills: skillsRouter,
  directory: directoryRouter,
  leads: leadsRouter,
});

export default swimRouter;
