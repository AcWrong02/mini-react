import {
  ReactDOM,
  useReducer,
} from "../which-react";
import "./index.css";

function FunctionComponent() {
  const [count, setCount] = useReducer((x) => x + 1, 0);

  return (
    <div className="border">
      <h1>函数组件</h1>
      <button onClick={(e) => {
        console.log("合成事件对象：", e)
        setCount()
      }}>{count}</button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  (<FunctionComponent />) as any
);
