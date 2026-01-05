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
function scheduleCallback(priorityLevel: PriorityLevel, callback: Callback) {
  const startTime = getCurrentTime();
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

  // 相当于到达时间 + 任务优先级用于排序
  newTask.sortIndex = expirationTime;
  push(taskQueue, newTask);

  if (!isHostCallbackScheduled && !isPerformingWork) {
    isHostCallbackScheduled = true;
    requestHostCallback();
  }
}

function requestHostCallback() {}

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
      const continuationCallback = callback(didUserCallbackTimeout);
      if (typeof continuationCallback === "function") {
        currentTask.callback = continuationCallback;
        return true;
      } else {
        if (currentTask === peek(taskQueue)) {
          pop(taskQueue);
          currentTime = getCurrentTime();
        }
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
    return false;
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
