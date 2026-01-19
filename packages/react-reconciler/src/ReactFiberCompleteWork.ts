import { isNum, isStr } from "shared/utils";
import { Fiber } from "./ReactInternalTypes";
import { ClassComponent, Fragment, FunctionComponent, HostComponent, HostRoot, HostText } from "./ReactWorkTags";

export function completeWork(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  const newProps = workInProgress.pendingProps;
  switch (workInProgress.tag) {
    case HostRoot:
    case Fragment:
    case ClassComponent:
    case FunctionComponent: {
      return null;
    }
    case HostComponent: {
      // 原生标签,type是标签名
      const { type } = workInProgress;
      // 1. 创建真实DOM
      const instance = document.createElement(type);
      // 2. 初始化DOM属性
      finalizeInitialChildren(instance, newProps);
      // 3. 把子dom挂载到父dom上
      appendAllChildren(instance, workInProgress);
      workInProgress.stateNode = instance;
      return null;
    }
    case HostText: {
      workInProgress.stateNode = document.createTextNode(newProps);
      return null;
    }
    // todo
  }

  throw new Error(
    `Unknown unit of work tag (${workInProgress.tag}). This error is likely caused by a bug in ` +
    "React. Please file an issue."
  );
}

// 初始化属性
function finalizeInitialChildren(domElement: Element, props: any) {
  for (const propKey in props) {
    const nextProp = props[propKey];
    if (propKey === "children") {
      if (isStr(nextProp) || isNum(nextProp)) {
        // 属性
        domElement.textContent = nextProp;
      }
    } else {
      // 3. 设置属性
      if (propKey === "onClick") {
        domElement.addEventListener("click", nextProp);
      } else {
        (domElement as any)[propKey] = nextProp;
      }
    }
  }
}

function appendAllChildren(parent: Element, workInProgress: Fiber) {
  const parentClassName = parent.className
  const isRoot = parentClassName === 'box border'
  let nodeFiber = workInProgress.child; // 链表结构
  while (nodeFiber !== null) {
    if (isHost(nodeFiber)) {
      parent.appendChild(nodeFiber.stateNode); // nodeFiber.stateNode是DOM节点
    } else if (nodeFiber.child !== null) {
      nodeFiber = nodeFiber.child;
      continue;
    }

    // 如果处理完的是直接子节点，继续处理其兄弟节点
    if (nodeFiber.return === workInProgress) {
      // 移动到下一个兄弟节点，如果没有兄弟节点，循环会自然结束
      nodeFiber = nodeFiber.sibling;
      continue;
    }

    // 处理的是子孙节点，需要向上回溯
    while (nodeFiber.sibling === null) {
      if (nodeFiber.return === null || nodeFiber.return === workInProgress) {
        return;
      }

      nodeFiber = nodeFiber.return;
    }

    nodeFiber = nodeFiber.sibling;
  }
}

// fiber.stateNode是DOM节点
export function isHost(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostText;
}