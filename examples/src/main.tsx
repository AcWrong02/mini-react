import { ReactDOM, useReducer } from "../which-react";
import "./index.css";

function FunctionComponent() {
  const [count1, setCount1] = useReducer((x) => x + 1, 0);
  const arr = count1 % 2 === 0 ? [0, 1, 2, 3, 4] : [0, 1, 2, 3];

  // 0 删除
  return (
    <div className="border">
      <h3>函数组件</h3>
      <button
        onClick={() => {
          setCount1();
        }}
      >
        {count1}
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
