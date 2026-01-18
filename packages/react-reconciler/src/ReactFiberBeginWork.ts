import { Fiber } from "./ReactInternalTypes";
import { ClassComponent, Fragment, HostComponent, HostRoot, HostText } from "./ReactWorkTags";
import { mountChildFibers, reconcileChildFibers } from "./ReactChildFiber";
import { isNum, isStr } from "shared/utils";

// 1. 处理当前fiber，因为不同组件对应的fiber处理方式不同，
// 2. 返回子节点
export function beginWork(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  switch (workInProgress.tag) {
    case HostRoot:
      return updateHostRoot(current, workInProgress);
    case HostComponent:
      return updateHostComponent(current, workInProgress);
    case HostText:
      return updateHostText(current, workInProgress);
    case Fragment: 
      return updateHostFragment(current, workInProgress)
    case ClassComponent:
      return updateClassComponent(current, workInProgress)
    // todo
  }
  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
      "React. Please file an issue."
  );
}

// 根Fiber
function updateHostRoot(current: Fiber | null, workInProgress: Fiber) {
  const nextChildren = workInProgress.memoizedState.element;

  reconcileChildren(current, workInProgress, nextChildren);

  return workInProgress.child;
}

// 原生标签，div，span
function updateHostComponent(current: Fiber | null, workInProgress: Fiber) {
  const { type, pendingProps } = workInProgress;
  const isDirectTextChild = shouldSetTextContent(type, pendingProps);
  if (isDirectTextChild) {
    // 文本属性
    return null;
  }
  // 如果原生标签只有一个文本，这个时候文本不会再生成Fiber节点，而是当做原生标签的属性
  // mark：为什么这边是从pendingProps取值
  const nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren);

  return workInProgress.child;
}

// 文本没有子节点，不需要协调
function updateHostText(current: Fiber | null, workInProgress: Fiber) {
  return null;
}

function updateHostFragment(current: Fiber | null, workInProgress: Fiber ) {
  const nextChildren = workInProgress.pendingProps.children;
  reconcileChildren(current, workInProgress, nextChildren);
  return workInProgress.child;
}

// 更新自己
// 协调子节点
function updateClassComponent(current: Fiber | null, workInProgress: Fiber) {
  const { type, pendingProps } = workInProgress;
  const instance = new type(pendingProps);
  const children = instance.render();
  reconcileChildren(current, workInProgress, children);
  return workInProgress.child;
}

// 协调子节点，构建新的fiber树
function reconcileChildren(
  current: Fiber | null,
  workInProgress: Fiber,
  nextChildren: any
) {
  if (current === null) {
    // 初次挂载
    workInProgress.child = mountChildFibers(workInProgress, null, nextChildren);
  } else {
    // 更新
    // 根Fiber首次走的是reconcileChildFibers流程
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren
    );
  }
}

function shouldSetTextContent(type: string, props: any): boolean {
  return (
    type === "textarea" ||
    type === "noscript" ||
    isStr(props.children) ||
    isNum(props.children) ||
    (typeof props.dangerouslySetInnerHTML === "object" &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}
