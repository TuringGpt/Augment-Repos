import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import "./App.css";
import SignIn from './pages/SignIn';

function Home() {
  return (
    <section id='center'>
      <h1>Welcome to Qualia</h1>
      <h3>
        Qualia is a purpose-built QA platform that gives us everything Google
        Forms does, plus an AI layer that turns all our reviewer submissions
        into a single consolidated report automatically.
      </h3>
      <Link to="/signin">
        <button>Sign in</button>
      </Link>
    </section>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<SignIn />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
