import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.daily(
  "cleanup-old-pageviews",
  { hourUTC: 2, minuteUTC: 0 },
  internal.pageViews.cleanupOldViews
);
crons.interval(
  "refresh-velocity-cache",
  { minutes: 15 },
  internal.inventory.refreshVelocityCache,
  {}
);
export default crons;

