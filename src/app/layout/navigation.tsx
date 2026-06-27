import clsx from "clsx";
type Navigation = {
  immersive: boolean;
};

function Navigation({ immersive }: Navigation) {
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
