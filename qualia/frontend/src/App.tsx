import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import "./App.css";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <section id='center'>
        <h1>Welcome to Quali</h1>
        <h3>
          Quali is a purpose-built QA platform that gives us everything Google
          Forms does, plus an AI layer that turns all our reviewer submissions
          into a single consolidated report automatically.{" "}
        </h3>
        <button>Sign in</button>
      </section>
    </>
  );
}

export default App;
