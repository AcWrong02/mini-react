import { ReactDOM, useReducer, useState, useRef, useLayoutEffect, useEffect } from "../which-react";
import "./index.css";

function FunctionComponent() {
  const [count1, setCount] = useReducer((x) => x + 1, 0);
  const [count2, setCount2] = useState(0);

  // layout effect
  useLayoutEffect(() => {
    console.log("useLayoutEffect"); //sy-log
  }, [count1]);

  // passive effect
  useEffect(() => {
    console.log("useEffect"); //sy-log
  }, [count2]);

  return (
    <div className="border">
      <h1>函数组件</h1>
      <button onClick={() => setCount()}>{count1}</button>
      <button onClick={() => setCount2(count2 + 1)}>{count2}</button>
      <Child count1={count1} count2={count2} />
    </div>
  );
}

function Child({ count1, count2 }: { count1: number; count2: number }) {
  // layout effect
  useLayoutEffect(() => {
    console.log("useLayoutEffect Child"); //sy-log
  }, [count1]);

  // passive effect
  useEffect(() => {
    console.log("useEffect Child"); //sy-log
  }, [count2]);

  return <div>Child</div>;
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  (<FunctionComponent />) as any
);