import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { notification } from 'antd';

import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';

import ForgetPassword from '@/pages/ForgetPassword';
import ResetPassword from '@/pages/ResetPassword';

import { useDispatch } from 'react-redux';

export default function AuthRouter() {
  const dispatch = useDispatch();

  // Surface a single, user-friendly toast once after a JWT expiration redirect
  // lands the user back on the auth router. The flag is set by errorHandler
  // before the hard reload so the message persists across the navigation.
  useEffect(() => {
    if (window.sessionStorage.getItem('sessionExpired') === '1') {
      window.sessionStorage.removeItem('sessionExpired');
      notification.config({ duration: 6, maxCount: 1 });
      notification.warning({
        message: 'Session expired',
        description: 'Your session has expired. Please sign in again.',
      });
    }
  }, []);

  return (
    <Routes>
      <Route element={<Login />} path="/" />
      <Route element={<Login />} path="/login" />
      <Route element={<Navigate to="/login" replace />} path="/logout" />
      <Route element={<ForgetPassword />} path="/forgetpassword" />
      <Route element={<ResetPassword />} path="/resetpassword/:userId/:resetToken" />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
