import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { notification } from 'antd';

import Login from '@/pages/Login';
import NotFound from '@/pages/NotFound';

import ForgetPassword from '@/pages/ForgetPassword';
import ResetPassword from '@/pages/ResetPassword';

import { useDispatch } from 'react-redux';
import * as actionTypes from '@/redux/auth/types';

const SESSION_EXPIRED_LOGOUT_KEY = 'sessionExpiredLogoutInProgress';

function LogoutRedirect() {
  const dispatch = useDispatch();

  useEffect(() => {
    const sessionExpired = window.localStorage.getItem(SESSION_EXPIRED_LOGOUT_KEY) === 'true';

    window.localStorage.removeItem('auth');
    window.localStorage.removeItem('settings');
    window.localStorage.removeItem('isLogout');
    window.localStorage.removeItem(SESSION_EXPIRED_LOGOUT_KEY);

    dispatch({ type: actionTypes.LOGOUT_SUCCESS });

    if (sessionExpired) {
      notification.warning({
        key: 'session-expired',
        message: 'Session expired',
        description: 'Your session has expired. Please sign in again to continue.',
      });
    }
  }, [dispatch]);

  return <Navigate to="/login" replace />;
}

export default function AuthRouter() {
  return (
    <Routes>
      <Route element={<Login />} path="/" />
      <Route element={<Login />} path="/login" />
      <Route element={<LogoutRedirect />} path="/logout" />
      <Route element={<ForgetPassword />} path="/forgetpassword" />
      <Route element={<ResetPassword />} path="/resetpassword/:userId/:resetToken" />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
