import {
  ContinuousEventPriority,
  DefaultEventPriority,
  DiscreteEventPriority,
  EventPriority,
  IdleEventPriority,
} from "react-reconciler/src/ReactEventPriorities";
import { DOMEventName } from "./DOMEventNames";
import * as Scheduler from "scheduler";
import {
  IdlePriority,
  ImmediatePriority,
  LowPriority,
  NormalPriority,
  UserBlockingPriority,
} from "scheduler/src/SchedulerPriorities";

export function createEventListenerWrapperWithPriority(
  targetContainer: EventTarget,
  domEventName: DOMEventName,
  eventSystemFlags: number
): Function {
  // 根据事件名称，获取优先级。比如click、input、drop等对应DiscreteEventPriority，drag、scroll等对应ContinuousEventPriority，
  // message也许处于Scheduler中，根据getCurrentSchedulerPriorityLevel()获取优先级。其它是DefaultEventPriority。
  const eventPriority = getEventPriority(domEventName);
  let listenerWrapper;
  switch (eventPriority) {
    case DiscreteEventPriority:
      listenerWrapper = dispatchDiscreteEvent;
      break;
    case ContinuousEventPriority:
      listenerWrapper = dispatchContinuousEvent;
      break;
    case DefaultEventPriority:
    default:
      listenerWrapper = dispatchEvent;
      break;
  }
  return listenerWrapper.bind(
    null,
    domEventName,
    eventSystemFlags,
    targetContainer
  );
}

// todo 不同的事件派发方法
function dispatchDiscreteEvent() {
  console.log(
    "%c [  ]-50",
    "font-size:13px; background:pink; color:#bf2c9f;",
    arguments
  );
}

function dispatchContinuousEvent() { }

function dispatchEvent() { }

export function getEventPriority(domEventName: DOMEventName): EventPriority {
  switch (domEventName) {
    // Used by SimpleEventPlugin:
    case "cancel":
    case "click":
    case "close":
    case "contextmenu":
    case "copy":
    case "cut":
    case "auxclick":
    case "dblclick":
    case "dragend":
    case "dragstart":
    case "drop":
    case "focusin":
    case "focusout":
    case "input":
    case "invalid":
    case "keydown":
    case "keypress":
    case "keyup":
    case "mousedown":
    case "mouseup":
    case "paste":
    case "pause":
    case "play":
    case "pointercancel":
    case "pointerdown":
    case "pointerup":
    case "ratechange":
    case "reset":
    case "resize":
    case "seeked":
    case "submit":
    case "touchcancel":
    case "touchend":
    case "touchstart":
    case "volumechange":
    // Used by polyfills: (fall through)
    case "change":
    case "selectionchange":
    case "textInput":
    case "compositionstart":
    case "compositionend":
    case "compositionupdate":
    // Only enableCreateEventHandleAPI: (fall through)
    case "beforeblur":
    case "afterblur":
    // Not used by React but could be by user code: (fall through)
    case "beforeinput":
    case "blur":
    case "fullscreenchange":
    case "focus":
    case "hashchange":
    case "popstate":
    case "select":
    case "selectstart":
      return DiscreteEventPriority;
    case "drag":
    case "dragenter":
    case "dragexit":
    case "dragleave":
    case "dragover":
    case "mousemove":
    case "mouseout":
    case "mouseover":
    case "pointermove":
    case "pointerout":
    case "pointerover":
    case "scroll":
    case "toggle":
    case "touchmove":
    case "wheel":
    // Not used by React but could be by user code: (fall through)
    case "mouseenter":
    case "mouseleave":
    case "pointerenter":
    case "pointerleave":
      return ContinuousEventPriority;
    case "message": {
      // 我们可能在调度器回调中。
      // 最终，这种机制将被替换为检查本机调度器上的当前优先级。
      const schedulerPriority = Scheduler.getCurrentPriorityLevel();
      switch (schedulerPriority) {
        case ImmediatePriority:
          return DiscreteEventPriority;
        case UserBlockingPriority:
          return ContinuousEventPriority;
        case NormalPriority:
        case LowPriority:
          return DefaultEventPriority;
        case IdlePriority:
          return IdleEventPriority;
        default:
          return DefaultEventPriority;
      }
    }
    default:
      return DefaultEventPriority;
  }
}
