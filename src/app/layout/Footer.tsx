import clsx from "clsx";
import { useAppContext } from "../../context/appContext";

function Footer() {
  const { app } = useAppContext();
  const immersive = app.layoutMode === "focused";
  return (
    <footer className={clsx("section", { "fade-out": immersive })} id="footer">
      <div className="container">
        <div className="placeholder1"></div>
        <div className="placeholder1"></div>
        <div className="placeholder1"></div>
      </div>
      <div className="container">
        <div className="placeholder1"></div>
        <div className="placeholder1"></div>
      </div>
    </footer>
  );
}

export default Footer;
