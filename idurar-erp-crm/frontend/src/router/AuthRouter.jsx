import { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { notification } from 'antd';

import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';

import ForgetPassword from '@/pages/ForgetPassword';
import ResetPassword from '@/pages/ResetPassword';

const SessionExpiredRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get('reason') === 'session-expired') {
      notification.config({
        duration: 8,
        maxCount: 1,
      });
      notification.warning({
        key: 'session-expired',
        message: 'Session expired',
        description: 'Your session expired. Please sign in again to continue.',
      });
    }

    navigate('/login', { replace: true });
  }, [location.search, navigate]);

  return null;
};

export default function AuthRouter() {
  return (
    <Routes>
      <Route element={<Login />} path="/" />
      <Route element={<Login />} path="/login" />
      <Route element={<SessionExpiredRedirect />} path="/logout" />
      <Route element={<ForgetPassword />} path="/forgetpassword" />
      <Route element={<ResetPassword />} path="/resetpassword/:userId/:resetToken" />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
