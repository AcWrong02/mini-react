import { getCurrentTime } from "shared/utils";
import {
  IdlePriority,
  ImmediatePriority,
  LowPriority,
  NoPriority,
  NormalPriority,
  PriorityLevel,
  UserBlockingPriority,
} from "./SchedulerPriorities";
import { pop, push } from "./SchedulerMinHeap";
import { peek } from "./SchedulerMinHeap";
import {
  lowPriorityTimeout,
  maxSigned31BitInt,
  normalPriorityTimeout,
  userBlockingPriorityTimeout,
} from "./SchedulerFeatureFlags";

type Callback = (arg: boolean) => Callback | null | undefined;

export type Task = {
  id: number;
  callback: Callback | null;
  priorityLevel: PriorityLevel;
  startTime: number;
  expirationTime: number;
  sortIndex: number;
};

const taskQueue: Array<Task> = []; // 没有延迟的任务
const timerQueue: Array<Task> = []; // 有延迟的任务

// 标记task的唯一性
let taskIdCounter = 0;

let currentTask: Task | null = null;
let currentPriorityLevel: PriorityLevel = NoPriority;

// 记录时间切片的起始值，时间戳
let startTime = -1;

// 时间切片，这是个时间段
let frameInterval = 5;

// 是否有work正在执行
let isPerformingWork = false;

// 主线程是否在调度
let isHostCallbackScheduled = false;

let isMessageLoopRunning = false;

// 是否有任务在倒计时
var isHostTimeoutScheduled = false;

let taskTimeoutID = -1;

function getTimeoutForPriority(priorityLevel: PriorityLevel): number {
  switch (priorityLevel) {
    case ImmediatePriority:
      return -1;
    case UserBlockingPriority:
      return userBlockingPriorityTimeout;
    case NormalPriority:
      return normalPriorityTimeout;
    case LowPriority:
      return lowPriorityTimeout;
    case IdlePriority:
      return maxSigned31BitInt;
    default:
      return 1000;
  }
}

/**
 * 任务调度器入口函数
 * @param priorityLevel 优先级
 * @param callback 回调函数
 */
function scheduleCallback(
  priorityLevel: PriorityLevel,
  callback: Callback,
  options?: { delay: number }
) {
  const currentTime = getCurrentTime();
  let startTime;

  if (typeof options === "object" && options !== null) {
    let delay = options.delay;
    if (typeof delay === "number" && delay > 0) {
      // 有效延迟时间
      startTime = currentTime + delay;
    } else {
      startTime = currentTime;
    }
  } else {
    startTime = currentTime;
  }

  const timeout = getTimeoutForPriority(priorityLevel);
  // expirationTime是过期时间，理论上是任务执行时间
  const expirationTime = startTime + timeout;
  const newTask: Task = {
    id: taskIdCounter++,
    callback,
    priorityLevel,
    startTime,
    expirationTime,
    sortIndex: -1,
  };

  if (startTime > currentTime) {
    // 任务有延迟
    newTask.sortIndex = startTime;
    // 任务在timerQueue中到达开始时间之后，就会被放到 taskQueue
    push(timerQueue, newTask);
    if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
      if (isHostTimeoutScheduled) {
        // newTask 才是堆顶任务，才应该最先到达执行时间，newTask应该被倒计时，但是其他任务也被倒计时了，说明有问题
        cancelHostTimeout();
      } else {
        isHostTimeoutScheduled = true;
      }

      requestHostTimeout(handleTimeout, startTime - currentTime);
    }
  } else {
    // 相当于到达时间 + 任务优先级用于排序
    newTask.sortIndex = expirationTime;
    push(taskQueue, newTask);

    if (!isHostCallbackScheduled && !isPerformingWork) {
      isHostCallbackScheduled = true;
      requestHostCallback();
    }
  }
}

function requestHostCallback() {
  if (!isMessageLoopRunning) {
    isMessageLoopRunning = true;
    schedulePerformWorkUntilDeadline();
  }
}

function performWorkUntilDeadline() {
  if (isMessageLoopRunning) {
    const currentTime = getCurrentTime();
    // 记录了一个work的起始时间，其实就是一个时间切片的起始时间，是一个时间戳
    const startTime = currentTime;
    let hasMorkWork = true;
    try {
      hasMorkWork = flushWork(startTime);
    } finally {
      if (hasMorkWork) {
        schedulePerformWorkUntilDeadline();
      } else {
        isMessageLoopRunning = false;
      }
    }
  }
}

const channel = new MessageChannel();
const port = channel.port2;
channel.port1.onmessage = performWorkUntilDeadline;

function schedulePerformWorkUntilDeadline() {
  port.postMessage(null);
}

function flushWork(initialTime: number): boolean {
  isHostCallbackScheduled = false;
  isPerformingWork = true;

  let previousPriorityLevel = currentPriorityLevel;
  try {
    return workLoop(initialTime);
  } finally {
    currentTask = null;
    currentPriorityLevel = previousPriorityLevel;
    isPerformingWork = false;
  }
}

/**
 * 取消某个元素，由于最小堆没法直接删除元素，因此只能初步把task.callback设置为null
 * 调度过程中，当这个任务位于堆顶时，删掉
 */
function cancelCallback() {
  currentTask!.callback = null;
}

function getCurrentPriorityLevel(): PriorityLevel {
  return currentPriorityLevel;
}

/**
 * 时间分片任务的执行过程
 * @param initialTime 初始时间
 * @returns 是否还有任务要执行
 */
function workLoop(initialTime: number): boolean {
  let currentTime = initialTime;

  advanceTimers(currentTime);

  currentTask = peek(taskQueue);
  while (currentTask !== null) {
    if (currentTask.expirationTime > currentTime && shouldYieldToHost()) {
      break;
    }

    // 执行任务
    const callback = currentTask.callback;
    if (typeof callback === "function") {
      // 有效的任务
      currentTask.callback = null;
      currentPriorityLevel = currentTask.priorityLevel;
      const didUserCallbackTimeout = currentTask.expirationTime <= currentTime;
      currentTime = getCurrentTime();
      const continuationCallback = callback(didUserCallbackTimeout);
      if (typeof continuationCallback === "function") {
        currentTask.callback = continuationCallback;
        advanceTimers(currentTime);
        return true;
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
        }
        advanceTimers(currentTime);
      }
    } else {
      // 无效的任务
      pop(taskQueue);
    }

    currentTask = peek(taskQueue);
  }

  if (currentTask !== null) {
    return true;
  } else {
    const firstTimer = peek(timerQueue);
    if (firstTimer !== null) {
      requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
    }

    return false;
  }
}

function cancelHostTimeout() {
  clearTimeout(taskTimeoutID);
  taskTimeoutID = -1;
}

function requestHostTimeout(
  callback: (currentTime: number) => void,
  ms: number
) {
  taskTimeoutID = setTimeout(() => {
    callback(getCurrentTime());
  }, ms);
}

function advanceTimers(currentTime: number) {
  let timer = peek(timerQueue);
  while (timer !== null) {
    if (timer.callback === null) {
      // 无效的任务
      pop(timerQueue);
    } else if (timer.startTime <= currentTime) {
      // 有效的任务
      // 任务已经到达开始时间，可以推入taskQueue
      pop(timerQueue);
      timer.sortIndex = timer.expirationTime;
      push(taskQueue, timer);
    } else {
      return;
    }
    timer = peek(timerQueue);
  }
}

function handleTimeout(currentTime: number) {
  isHostTimeoutScheduled = false;
  //  把延迟任务从timerQueue中推入taskQueue
  advanceTimers(currentTime);

  if (!isHostCallbackScheduled) {
    if (peek(taskQueue) !== null) {
      isHostCallbackScheduled = true;
      requestHostCallback();
    } else {
      const firstTimer = peek(timerQueue);
      if (firstTimer !== null) {
        requestHostTimeout(handleTimeout, firstTimer.startTime - currentTime);
      }
    }
  }
}

function shouldYieldToHost() {
  const timeElapsed = getCurrentTime() - startTime;

  if (timeElapsed < frameInterval) {
    return false;
  }

  return true;
}

export {
  ImmediatePriority,
  UserBlockingPriority,
  NormalPriority,
  IdlePriority,
  LowPriority,
  scheduleCallback, // 某个任务进入调度器，等待调度
  cancelCallback, // 取消某个任务，由于最小堆没法直接删除，因此只能初步把 task.callback 设置为null
  getCurrentPriorityLevel, // 获取当前正在执行任务的优先级
  shouldYieldToHost as shouldYield, // 把控制权交换给主线程
};
