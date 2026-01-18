import { ReactDOM } from "../which-react";
import "./index.css";

let fragment1 = (
  <>
    <>
      <h3>1</h3>
    </>
    <h4>2</h4>
    <>o</>
  </>
);


const jsx = (
  <div className="box border">
    {fragment1}
    <h1 className="border">omg</h1>
    123
    <h2>react</h2>
    omg2
  </div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);
