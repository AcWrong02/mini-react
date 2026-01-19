import { Fiber } from "./ReactInternalTypes";

type Hook = {
    memoizedState: any;
    next: null | Hook;
};

// 当前正在工作的函数组件的Fiber
let currentlyRenderingFiber: Fiber | null = null;
let workInProgressHook: Hook | null = null;
let currentHook: Hook | null = null;

export function renderWithHooks<Props>(
    current: Fiber | null,
    workInProgress: Fiber,
    Component: any,
    props: Props
): any {
    currentlyRenderingFiber = workInProgress;
    workInProgress.memoizedState = null;

    let children = Component(props);

    finishRenderingHooks();

    return children
}

function finishRenderingHooks() {
    currentlyRenderingFiber = null;
    currentHook = null;
    workInProgressHook = null;
}

export function useReducer<S, I, A>(
    reducer: (state: S, action: A) => S,
    initialArg: I,
    init?: (initalArg: I) => S
) {
    // 1. 构建hook链表
    const hook: Hook = { memoizedState: null, next: null };

    let initialState: S;
    if (init !== undefined) {
        initialState = init(initialArg);
    } else {
        initialState = initialArg as any
    }

    // 2. 区分函数组件是初次挂载还是更新
    hook.memoizedState = initialState;

    // 3. dispatch
    const dispatch = (action: A) => {
        const newValue = reducer(initialState, action);

        console.log(
            "%c [  ]-5",
            "font-size:13px; background:pink; color:#bf2c9f;",
            newValue
        );
    }

    hook.memoizedState = initialState;

    return [hook.memoizedState, dispatch];
}