import { ReactNodeList } from "shared/ReactTypes";
import { FiberRoot } from "./ReactInternalTypes";

export function updateContainer(element: ReactNodeList, container: FiberRoot) {
  // 1. 获取current
  const current = container.current;
  current.memoizedState = { element };

  console.log(
    "%c [  ]-11",
    "font-size:13px; background:pink; color:#bf2c9f;",
    current
  );
  // ! 2. 调度更新
  // scheduleUpdateOnFiber()
}
