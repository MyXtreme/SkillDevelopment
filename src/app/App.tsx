import "./App.css";

import Navigation from "./layout/Navigation.tsx";
import Main from "./layout/Main.tsx";
import Footer from "./layout/Footer.tsx";

function App() {
  return (
    <div id="app">
      <Navigation />
      <Main />

      <Footer />
    </div>
  );
}

export default App;
