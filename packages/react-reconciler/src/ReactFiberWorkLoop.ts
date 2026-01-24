import { Fiber, FiberRoot } from "./ReactInternalTypes";
import { ensureRootIsScheduled } from "./ReactFiberRootScheduler";
import { createWorkInProgress } from "./ReactFiber";
import { beginWork } from "./ReactFiberBeginWork";
import { completeWork } from "./ReactFiberCompleteWork";
import {
  commitMutationEffects,
  flushPassiveEffects,
} from "./ReactFiberCommitWork";
import { Scheduler } from "scheduler";
import { NormalPriority } from "scheduler/src/SchedulerPriorities";

type ExecutionContext = number;

export const NoContext = /*             */ 0b000;
const BatchedContext = /*               */ 0b001;
export const RenderContext = /*         */ 0b010;
export const CommitContext = /*         */ 0b100;

// Describes where we are in the React execution stack
let executionContext: ExecutionContext = NoContext;

let workInProgress: Fiber | null = null;
let workInProgressRoot: FiberRoot | null;

export function scheduleUpdateOnFiber(
  root: FiberRoot,
  fiber: Fiber,
  isSync?: boolean
) {
  workInProgressRoot = root;
  workInProgress = fiber;

  if (isSync) {
    queueMicrotask(() => performConcurrentWorkOnRoot(root));
  } else {
    ensureRootIsScheduled(root);
  }
}


export function performConcurrentWorkOnRoot(root: FiberRoot) {
  // 1. render，构建Fiber树VDOM
  renderRootSync(root);
  // 2. commit，VDOM——>DOM
  const finishedWork = root.current.alternate;
  root.finishedWork = finishedWork;
  commitRoot(root);
}

function renderRootSync(root: FiberRoot) {
  // 1. render阶段开始
  executionContext |= RenderContext;
  const prevExcutionContext = executionContext;
  // 2. 初始化
  prepareFreshStack(root);
  // 3. 遍历构建Fiber树
  workLoopSync();
  // 4. render结束
  executionContext = prevExcutionContext;
  workInProgressRoot = null;
}

function commitRoot(root: FiberRoot) {
  // 1. commit阶段开始
  executionContext |= CommitContext;
  const prevExcutionContext = executionContext;
  // !2.1 mutation阶段, 渲染DOM树
  commitMutationEffects(root, root.finishedWork as Fiber); //Fiber,HostRoot=3
  // !2.2 passive effect阶段，执行 passive effect
  Scheduler.scheduleCallback(NormalPriority, () => {
    flushPassiveEffects(root.finishedWork as Fiber);
  });
  // 3. commit结束
  executionContext = prevExcutionContext;
  workInProgressRoot = null;
}

function prepareFreshStack(root: FiberRoot): Fiber {
  root.finishedWork = null;

  workInProgressRoot = root; // FiberRoot
  const rootWorkInProgress = createWorkInProgress(root.current, null); // Fiber
  if (workInProgress === null) {
    workInProgress = rootWorkInProgress; // Fiber
  }

  return rootWorkInProgress;
}

function workLoopSync() {
  while (workInProgress !== null) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork: Fiber) {
  const current = unitOfWork.alternate;
  // 1. beginWork
  let next = beginWork(current, unitOfWork);
  // ! 把pendingProps更新到memoizedProps
  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  // 1.1 执行自己
  // 1.2 返回子节点
  if (next === null) {
    // 没有产生新的work
    // 2. completeWork
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
}

// 深度优先遍历
function completeUnitOfWork(unitOfWork: Fiber) {
  let completedWork = unitOfWork;

  do {
    const current = completedWork.alternate;
    const returnFiber = completedWork.return;
    let next = completeWork(current, completedWork);
    if (next !== null) {
      workInProgress = next;
      return;
    }

    const siblingFiber = completedWork.sibling;
    if (siblingFiber !== null) {
      workInProgress = siblingFiber;
      return;
    }

    completedWork = returnFiber as Fiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
}
