import clsx from "clsx";
import { useAppContext } from "../../context/appContext";

function Navigation() {
  const { app } = useAppContext();
  const immersive = app.layoutMode === "focused";
  return (
    <nav className="section" id="navigation">
      {/* TODO: add logo */}
      <div className="container">
        <h1>MyXtype</h1>
        <div className={clsx("placeholder1", { "fade-out": immersive })}></div>
      </div>
      <div className={clsx("placeholder1", { "fade-out": immersive })}></div>
    </nav>
  );
}
export default Navigation;
