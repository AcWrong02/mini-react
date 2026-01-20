import { ReactDOM, useReducer } from "../which-react";
import "./index.css";

function FunctionComponent() {
  const [count1, setCount1] = useReducer((x) => x + 1, 0);
  return (
    <div>
      <button
        onClick={() => {
          setCount1();
        }}
      >
        {count1}
      </button>
    </div>
  );
}


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  (<FunctionComponent />) as any
);
