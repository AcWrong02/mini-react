import { ReactDOM, Component } from "../which-react";
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

class ClassComponent extends Component<any, any> {
  constructor(props: { name: string }) {
    super(props);
  }
  render() {
    return (
      <div>
        <h3>{this.props.name}</h3>
      </div>
    );
  }
}

function FunctionComponent({ name }: { name: string }) {
  return (
    <div>
      <h3>{name}</h3>
    </div>
  );
}

const jsx = (
  <div className="box border">
    <FunctionComponent name="函数组件" />
    <ClassComponent name="类组件" />
    {fragment1}
    <h1 className="border">omg</h1>
    123
    <h2>react</h2>
    omg2
  </div>
);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(jsx);
