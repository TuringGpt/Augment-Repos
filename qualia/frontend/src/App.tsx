import { BrowserRouter, Routes, Route } from 'react-router-dom';
import "./App.css";
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import ForgotPassword from './pages/ForgotPassword';

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
