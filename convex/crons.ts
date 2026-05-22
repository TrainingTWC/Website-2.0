import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.daily(
  "cleanup-old-pageviews",
  { hourUTC: 2, minuteUTC: 0 },
  internal.pageViews.cleanupOldViews
);
export default crons;
