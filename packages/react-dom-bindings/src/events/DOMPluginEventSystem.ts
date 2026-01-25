import { DOMEventName } from "./DOMEventNames";
import { allNativeEvents } from "./EventRegistry";

import * as SimpleEventPlugin from "./plugins/SimpleEventPlugin";
import { EventSystemFlags, IS_CAPTURE_PHASE } from "./EventSystemFlags";
import { createEventListenerWrapperWithPriority } from "./ReactDOMEventListener";
import {
  addEventBubbleListener,
  addEventCaptureListener,
} from "./EventListener";

SimpleEventPlugin.registerEvents();
// EnterLeaveEventPlugin.registerEvents();
// ChangeEventPlugin.registerEvents();
// SelectEventPlugin.registerEvents();
// BeforeInputEventPlugin.registerEvents();

// 需要分别附加到媒体元素的事件列表。
export const mediaEventTypes: Array<DOMEventName> = [
  "abort",
  "canplay",
  "canplaythrough",
  "durationchange",
  "emptied",
  "encrypted",
  "ended",
  "error",
  "loadeddata",
  "loadedmetadata",
  "loadstart",
  "pause",
  "play",
  "playing",
  "progress",
  "ratechange",
  "resize",
  "seeked",
  "seeking",
  "stalled",
  "suspend",
  "timeupdate",
  "volumechange",
  "waiting",
];

// 我们不应该将这些事件委托给容器，而是应该直接在实际的目标元素上设置它们。这主要是因为这些事件在DOM中的冒泡行为并不一致。
export const nonDelegatedEvents: Set<DOMEventName> = new Set([
  "cancel",
  "close",
  "invalid",
  "load",
  "scroll",
  "scrollend",
  "toggle",
  // In order to reduce bytes, we insert the above array of media events
  // into this Set. Note: the "error" event isn't an exclusive media event,
  // and can occur on other elements too. Rather than duplicate that event,
  // we just take it from the media events array.
  // 为了减少字节数，我们将上述媒体事件数组插入到这个 Set 中。
  // 注意："error" 事件并不是一个独占的媒体事件，也可能发生在其他元素上。我们不会重复这个事件，而是直接从媒体事件数组中取出。
  ...mediaEventTypes,
]);

// todo 事件绑定
const listeningMarker = "_reactListening" + Math.random().toString(36).slice(2);
export function listenToAllSupportedEvents(rootContainerElement: EventTarget) {
  // 防止重复绑定
  if (!(rootContainerElement as any)[listeningMarker]) {
    (rootContainerElement as any)[listeningMarker] = true;
    // 事件绑定
    allNativeEvents.forEach((domEventName) => {
      // 特殊处理selectiononchange
      // 捕获、冒泡
      // 有些事件在DOM上冒泡行为不一致，这些事件就不做事件委托
      if (!nonDelegatedEvents.has(domEventName)) {
        listenToNativeEvent(domEventName, false, rootContainerElement);
      }
      listenToNativeEvent(domEventName, true, rootContainerElement);
    })
  }
}

export function listenToNativeEvent(
  domEventName: DOMEventName,
  isCapturePhaseListener: boolean,
  target: EventTarget
): void {
  let eventSystemFlags = 0;
  if (isCapturePhaseListener) {
    eventSystemFlags |= IS_CAPTURE_PHASE;
  }
  addTrappedEventListener(
    target,
    domEventName,
    eventSystemFlags,
    isCapturePhaseListener
  );
}

function addTrappedEventListener(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: EventSystemFlags,
  isCapturePhaseListener: boolean
) {
  // ! 1. 获取对应事件，事件定义在ReactDOMEventListener.js中
  // 如DiscreteEventPriority对应dispatchDiscreteEvent，ContinuousEventPriority对应dispatchContinuousEvent
  let listener = createEventListenerWrapperWithPriority(
    targetContainer,
    domEventName,
    eventSystemFlags
  );

  // ! 2. 绑定事件
  if (isCapturePhaseListener) {
    // * 捕获阶段
    addEventCaptureListener(targetContainer, domEventName, listener);
  } else {
    addEventBubbleListener(targetContainer, domEventName, listener);
  }
}