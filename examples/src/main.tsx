import { ReactDOM } from "../which-react";
import "./index.css";

const jsx = (
  <div className="box border">
    <h1 className="border">omg</h1>
    <h2>react</h2>
  </div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);
