import { ReactDOM, useReducer, useState, useMemo } from "../which-react";
import "./index.css";

function FunctionComponent() {
  const [count1, setCount] = useReducer((x) => x + 1, 0);
  const [count2, setCount2] = useState(0);

  const expensive = useMemo(() => {
    console.log("compute");
    let sum = 0;
    for (let i = 0; i < count1; i++) {
      sum += i;
    }
    return sum;
    //只有count变化，这里才重新执行
  }, [count1]);

  // 昂贵运算
  // const expensive = () => {
  //   console.log("compute");
  //   let sum = 0;
  //   for (let i = 0; i < count1 * 100; i++) {
  //     sum += i;
  //   }
  //   return sum;
  //   //只有count变化，这里才重新执行
  // };

  return (
    <div className="border">
      <h1>函数组件</h1>
      <p>{expensive}</p>
      <button onClick={() => setCount()}>{count1}</button>
      <button onClick={() => setCount2(count2 + 1)}>{count2}</button>
    </div>
  );
}


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  (<FunctionComponent />) as any
);
