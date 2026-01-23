import { ReactDOM, useReducer, useState, useMemo, useCallback } from "../which-react";
import "./index.css";

function FunctionComponent() {
  const [count1, setCount] = useReducer((x) => x + 1, 0);
  const [count2, setCount2] = useState(0);

  // const addClick = () => {
  //   //   ajax('xxx/'+count1)
  //   let sum = 0;
  //   for (let i = 0; i < count1; i++) {
  //     sum += i;
  //   }
  //   return sum;
  // };

  const addClick = useCallback(() => {
    let sum = 0;
    for (let i = 0; i < count1; i++) {
      sum += i;
    }
    return sum;
  }, [count1]);

  const expensive = useMemo(() => {
    //只有addClick变化，这里才重新执行
    console.log("compute");
    return addClick();
  }, [addClick]);

  return (
    <div className="border">
      <h1>函数组件</h1>
      <p>{expensive}</p>
      <button onClick={() => setCount()}>{count1}</button>
      <button onClick={() => setCount2(count2 + 1)}>{count2}</button>

      {/* <Child addClick={addClick} /> */}
    </div>
  );
}

// // memo 允许组件在 props 没有改变的情况下跳过重新渲染。
// const Child = memo(({ addClick }: { addClick: () => number }) => {
//   console.log("child render"); //sy-log
//   return (
//     <div>
//       <h1>Child</h1>
//       <button onClick={() => console.log(addClick())}>add</button>
//     </div>
//   );
// });
ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  (<FunctionComponent />) as any
);