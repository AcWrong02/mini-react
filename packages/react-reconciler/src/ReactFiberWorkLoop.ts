import { Fiber, FiberRoot } from "./ReactInternalTypes";
import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";

let workInProgress: Fiber | null = null;
let workInProgressRoot: FiberRoot | null;

export function scheduleUpdateOnFiber(root: FiberRoot, fiber: Fiber) {
  workInProgressRoot = root;
  workInProgress = fiber;

  ensureRootIsScheduled(root);
}

export function performConcurrentWorkOnRoot(root: FiberRoot) {
  // 1. render，构建Fiber树VDOM
  // 2. commit，VDOM——>DOM
}
