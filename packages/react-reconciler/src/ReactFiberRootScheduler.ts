import { performConcurrentWorkOnRoot } from "./ReactFiberWorkLoop";
import { FiberRoot } from "./ReactInternalTypes";
import { Scheduler } from "scheduler";
import { NormalPriority } from "scheduler/src/SchedulerPriorities";

export function ensureRootIsScheduled(root: FiberRoot) {
  queueMicrotask(() => {
    scheduleTaskForRootDuringMicrotask(root);
  });
}

function scheduleTaskForRootDuringMicrotask(root: FiberRoot) {
  Scheduler.scheduleCallback(
    NormalPriority,
    performConcurrentWorkOnRoot.bind(null, root)
  );
}
