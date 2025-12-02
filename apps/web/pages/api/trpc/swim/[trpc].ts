import { createNextApiHandler } from "@calcom/trpc/server/createNextApiHandler";
import { swimRouter } from "@calcom/trpc/server/routers/viewer/swim/_router";

export default createNextApiHandler(swimRouter);
