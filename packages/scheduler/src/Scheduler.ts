import {
  IdlePriority,
  ImmediatePriority,
  LowPriority,
  NoPriority,
  NormalPriority,
  PriorityLevel,
  UserBlockingPriority,
} from "./SchedulerPriorities";

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

let currentTask: Task | null = null;
let currentPriorityLevel: PriorityLevel = NoPriority;

/**
 * 任务调度器入口函数
 * @param priorityLevel 优先级
 * @param callback 回调函数
 */
function scheduleCallback(priorityLevel: PriorityLevel, callback: Callback) {}

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

function shouldYieldToHost() {}

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
