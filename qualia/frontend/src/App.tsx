import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import "./App.css";
import SignIn from './pages/SignIn';
import ForgotPassword from './pages/ForgotPasswords';

function Home() {
  return (
    <section id='center'>
      <h1>Welcome to Qualia</h1>
      <h3>
        Qualia is a purpose-built QA platform that gives us everything Google
        Forms does, plus an AI layer that turns all our reviewer submissions
        into a single consolidated report automatically.
      </h3>
      <Link to="/signin" className="sign-in-button">
        Sign in
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
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
