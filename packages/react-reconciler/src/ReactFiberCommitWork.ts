import { isHost } from "./ReactFiberCompleteWork";
import { ChildDeletion, Placement } from "./ReactFiberFlags";
import { Fiber, FiberRoot } from "./ReactInternalTypes";
import { HostComponent, HostRoot, HostText } from "./ReactWorkTags";

export function commitMutationEffects(root: FiberRoot, finishedWork: Fiber) {
  // 1. 遍历
  recursivelyTraverseMutationEffects(root, finishedWork);
  commitReconciliationEffects(finishedWork);
}

function recursivelyTraverseMutationEffects(
  root: FiberRoot,
  parentFiber: Fiber
) {
  let child = parentFiber.child;
  // 遍历单链表
  while (child !== null) {
    commitMutationEffects(root, child);
    child = child.sibling;
  }
}

// 提交协调的产生的effects，比如flags，Placement、Update、ChildDeletion
function commitReconciliationEffects(finishedWork: Fiber) {
  const flags = finishedWork.flags;
  if (flags & Placement) {
    // 页面初次渲染 新增插入 appendChild
    // todo 页面更新，修改位置 appendChild || insertBefore
    commitPlacement(finishedWork);
    finishedWork.flags &= ~Placement;
  }
  if (flags & ChildDeletion) {
    const parentFiber = isHostParent(finishedWork) ? finishedWork : getHostParentFiber(finishedWork);
    const parentDom = parentFiber.stateNode;
    commitDeletions(finishedWork.deletions!, parentDom);
    finishedWork.flags &= ~ChildDeletion;
    finishedWork.deletions = null;
  }
}

// 根据fiber删除dom节点，父dom、子dom
function commitDeletions(
  deletions: Array<Fiber>,
  parentDOM: Element | Document | DocumentFragment
) {
  deletions.forEach((deletion) => {
    parentDOM.removeChild(getStateNode(deletion));
  });
}

function getStateNode(fiber: Fiber) {
  let node = fiber;
  while (1) {
    if (isHost(node) && node.stateNode) {
      return node.stateNode;
    }
    node = node.child as Fiber;
  }
}

function commitPlacement(finishedWork: Fiber) {
  // parentDom.appendChild(domNode);
  if (finishedWork.stateNode && isHost(finishedWork)) {
    // finishedWork是有dom节点
    const domNode = finishedWork.stateNode;
    // 找domNode的父DOM节点对应的fiber
    const parentFiber = getHostParentFiber(finishedWork);

    let parentDom = parentFiber.stateNode;

    if (parentDom.containerInfo) {
      // HostRoot
      parentDom = parentDom.containerInfo;
    }

    // 遍历fiber，寻找finishedWork的兄弟节点，并且这个sibling有dom节点，且是更新的节点。在本轮不发生移动
    const before = getHostSibling(finishedWork);

    insertOrAppendPlacementNode(finishedWork, before, parentDom);
  } else {
    // Fragment
    let kid = finishedWork.child;
    while (kid !== null) {
      commitPlacement(kid);
      kid = kid.sibling;
    }
  }
}

function getHostSibling(fiber: Fiber) {
  let node = fiber;
  while (true) {
    // 1️⃣ 向上找可以用的 sibling
    while (node.sibling === null) {
      if (node.return === null || isHostParent(node.return)) {
        return null;
      }
      node = node.return;
    }

    // 2️⃣ 找到 sibling
    node = node.sibling;

    // 3️⃣ 向下遍历，直到找到 Host 节点
    let restartOuter = false;

    while (!isHost(node)) {
      // 跳过需要 Placement 的节点
      if (node.flags & Placement) {
        restartOuter = true;
        break;
      }

      if (node.child === null) {
        restartOuter = true;
        break;
      }

      node = node.child;
    }

    // 等价于 continue sibling
    if (restartOuter) {
      continue;
    }

    // 4️⃣ 找到 HostComponent | HostText
    if (!(node.flags & Placement)) {
      return node.stateNode;
    }
  }
  return null;
}

// 新增插入 | 位置移动
// insertBefore | appendChild
function insertOrAppendPlacementNode(
  node: Fiber,
  before: Element,
  parent: Element
) {
  if (before) {
    parent.insertBefore(getStateNode(node), before);
  } else {
    parent.appendChild(getStateNode(node));
  }
}

function getHostParentFiber(fiber: Fiber): Fiber {
  let parent = fiber.return;
  while (parent !== null) {
    if (isHostParent(parent)) {
      return parent;
    }
    parent = parent.return;
  }
  throw new Error(
    "Expected to find a host parent. This error is likely caused by a bug " +
    "in React. Please file an issue."
  );
}

// 检查fiber是HostParent
function isHostParent(fiber: Fiber): boolean {
  return fiber.tag === HostComponent || fiber.tag === HostRoot;
}
