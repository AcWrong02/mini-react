import { isNum, isStr } from "shared/utils";
import { Fiber } from "./ReactInternalTypes";
import { HostComponent, HostRoot } from "./ReactWorkTags";

export function completeWork(
  current: Fiber | null,
  workInProgress: Fiber
): Fiber | null {
  switch (workInProgress.tag) {
    case HostRoot: {
      return null;
    }
    case HostComponent: {
      // 原生标签,type是标签名
      const { type } = workInProgress;
      // 1. 创建真实DOM
      const instance = document.createElement(type);
      // 2. 初始化DOM属性
      finalizeInitialChildren(instance, workInProgress.pendingProps);
      // 3. 把子dom挂载到父dom上
      appendAllChildren(instance, workInProgress);
      workInProgress.stateNode = instance;
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
      (domElement as any)[propKey] = nextProp;
    }
  }
}

function appendAllChildren(parent: Element, workInProgress: Fiber) {
  let nodeFiber = workInProgress.child;
  if (nodeFiber) {
    parent.appendChild(nodeFiber.stateNode);
  }
}
