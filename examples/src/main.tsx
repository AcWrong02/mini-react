import { ReactDOM, useReducer, useState, useRef } from "../which-react";
import "./index.css";

function FunctionComponent() {
  const [count1, setCount] = useReducer((x) => x + 1, 0);
  const [count2, setCount2] = useState(0);

  let ref = useRef(0);

  function handleClick() {
    ref.current = ref.current + 1;
    alert("You clicked " + ref.current + " times!");
  }

  return (
    <div className="border">
      <h1>函数组件</h1>
      <button onClick={() => setCount()}>{count1}</button>
      <button onClick={() => setCount2(count2 + 1)}>{count2}</button>

      <button onClick={handleClick}>click</button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  (<FunctionComponent />) as any
);