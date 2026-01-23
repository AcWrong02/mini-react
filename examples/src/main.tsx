import { ReactDOM, useReducer, useState } from "../which-react";
import "./index.css";

function FunctionComponent() {
  const [count1, setCount1] = useReducer((x) => x + 1, 1);
  const [count2, setCount2] = useState(1);

  // const arr = count1 % 2 === 0 ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];
  // const arr = count1 % 2 === 0 ? [0, 1, 2, 3, 4] : [0, 1, 2, 4];

  const arr = count1 % 2 === 0 ? [0, 1, 2, 3, 4] : [3, 2, 0, 4, 1];

  // old 0, 1, 2, 4
  // new 0, 1, 2, 3, 4
  // 1个before 4

  // old 3, 2, 0, 4, 1
  // new 0, 1, 2, 3, 4
  // 3个before null

  const _cls = count1 % 2 === 0 ? "red green_bg" : "green red_bg";

  // 0 删除
  return (
    <div className="border">
      <h3 className={_cls}>函数组件</h3>
      <button
        onClick={() => {
          setCount1();
        }}
      >
        {count1}
      </button>
      <button
        onClick={() => {
          setCount2(count2 + 1);
        }}
      >
        {count2}
      </button>
      <ul>
        {arr.map((item) => (
          <li key={"li" + item}>{item}</li>
        ))}
      </ul>

      {/* {count1 % 2 === 0 ? (
        <button
          onClick={() => {
            setCount1();
          }}
        >
          {count1}
        </button>
      ) : (
        <span
          onClick={() => {
            setCount1();
          }}
        >
          react
        </span>
      )} */}
    </div>
  );
}


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  (<FunctionComponent />) as any
);
