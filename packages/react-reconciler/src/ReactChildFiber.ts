import { createFiberFromElement, createFiberFromText, createWorkInProgress } from "./ReactFiber";
import { Fiber } from "./ReactInternalTypes";
import { REACT_ELEMENT_TYPE } from "shared/ReactSymbols";
import { Placement } from "./ReactFiberFlags";
import { ReactElement } from "shared/ReactTypes";
import { isArray } from "shared/utils";

type ChildReconciler = (
  returnFiber: Fiber,
  currentFirstChild: Fiber | null,
  newChild: any
) => Fiber | null;

export const reconcileChildFibers: ChildReconciler =
  createChildReconciler(true);
export const mountChildFibers: ChildReconciler = createChildReconciler(false);

// wrapper function
// 协调子节点
function createChildReconciler(shouldTrackSideEffects: boolean) {
  // 给fiber节点添加flags
  function placeSingleChild(newFiber: Fiber) {
    if (shouldTrackSideEffects && newFiber.alternate === null) {
      newFiber.flags |= Placement;
    }
    return newFiber;
  }

  // 文本
  function reconcileSingleTextNode(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null, // todo 更新
    textContent: string
  ) {
    console.log(
      "%c [  ]-36",
      "font-size:13px; background:pink; color:#bf2c9f;",
      typeof textContent
    );
    const created = createFiberFromText(textContent);
    created.return = returnFiber;
    return created;
  }

  function useFiber(fiber: Fiber, pendingProps: any) {
    const clone = createWorkInProgress(fiber, pendingProps);
    clone.index = 0;
    clone.sibling = null;
    return clone;
  }

  // 协调单个节点，对于页面初次渲染，创建fiber，不涉及对比复用老节点
  function reconcileSingleElement(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    element: ReactElement
  ) {
    // 节点复用的条件
    // ! 1. 同一层级下 2. key相同 3. 类型相同
    const key = element.key;
    let child = currentFirstChild;

    while (child !== null) {
      if (child.key === key) {
        const elementType = element.type;
        if (child.elementType === elementType) {
          // todo 后面其它fiber可以删除了
          const existing = useFiber(child, element.props);
          existing.return = returnFiber;
          return existing;
        } else {
          // 前提：React不认为同一层级下有两个相同的key值
          break;
        }
      } else {
        // todo
        // 删除单个节点
        // deleteChild()
      }
      // 老fiber节点是单链表
      child = child.sibling;
    }

    let createdFiber = createFiberFromElement(element);
    createdFiber.return = returnFiber;
    return createdFiber;
  }

  function createChild(returnFiber: Fiber, newChild: any): Fiber | null {
    if (isText(newChild)) {
      const created = createFiberFromText(newChild + "");
      created.return = returnFiber;
      return created;
    }

    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          const created = createFiberFromElement(newChild);
          created.return = returnFiber;
          return created;
        }
      }
    }

    return null;
  }

  function reconcileChildrenArray(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChildren: Array<any>
  ) {
    let resultFirstChild: Fiber | null = null; // 头结点
    let previousNewFiber: Fiber | null = null;
    let oldFiber = currentFirstChild;
    let newIdx = 0;

    // 初次渲染
    if (oldFiber === null) {
      for (; newIdx < newChildren.length; newIdx++) {
        const newFiber = createChild(returnFiber, newChildren[newIdx]);
        if (newFiber === null) {
          continue;
        }
        newFiber.index = newIdx; // 组件更新阶段，判断在更新前后的位置是否一致，如果不一致，需要移动
        if (previousNewFiber === null) {
          // 第一个节点，不要用newIdx判断，因为有可能有null，而null不是有效fiber
          resultFirstChild = newFiber;
        } else {
          previousNewFiber.sibling = newFiber;
        }
        previousNewFiber = newFiber;
      }
      return resultFirstChild;
    }

    return resultFirstChild;
  }

  function reconcileChildFibers(
    returnFiber: Fiber,
    currentFirstChild: Fiber | null,
    newChild: any
  ) {
    if (isText(newChild)) {
      return placeSingleChild(
        reconcileSingleTextNode(returnFiber, currentFirstChild, newChild + "")
      );
    }

    // 检查newChild类型，单个节点、文本、数组
    if (typeof newChild === "object" && newChild !== null) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE: {
          return placeSingleChild(
            reconcileSingleElement(returnFiber, currentFirstChild, newChild)
          );
        }
      }
    }

    // 子节点是数组
    if (isArray(newChild)) {
      return reconcileChildrenArray(returnFiber, currentFirstChild, newChild);
    }

    // todo
    return null;
  }

  return reconcileChildFibers;
}

function isText(newChild: any) {
  return (
    (typeof newChild === "string" && newChild !== "") ||
    typeof newChild === "number"
  );
}