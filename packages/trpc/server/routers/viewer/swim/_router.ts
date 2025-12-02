import { router } from "../../../trpc";
import swimmersRouter from "./swimmers";
import enrollmentsRouter from "./enrollments";
import attendanceRouter from "./attendance";
import progressNotesRouter from "./progress-notes";
import instructorRouter from "./instructor";
import managerRouter from "./manager";

export const swimRouter = router({
  swimmers: swimmersRouter,
  enrollments: enrollmentsRouter,
  attendance: attendanceRouter,
  progressNotes: progressNotesRouter,
  instructor: instructorRouter,
  manager: managerRouter,
});

export default swimRouter;
