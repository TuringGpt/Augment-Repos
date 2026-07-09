import { notification } from 'antd';
import codeMessage from './codeMessage';

const SESSION_EXPIRED_LOGOUT_PATH = '/logout?reason=session-expired';
const sessionExpiredResponse = {
  success: false,
  result: null,
  message: 'Your session expired. Please sign in again to continue.',
};

let isSessionExpiredLogoutInProgress = false;

const clearAuthState = () => {
  window.localStorage.removeItem('auth');
  window.localStorage.removeItem('settings');
  window.localStorage.removeItem('isLogout');
};

const handleSessionExpired = () => {
  if (isSessionExpiredLogoutInProgress) {
    return sessionExpiredResponse;
  }

  isSessionExpiredLogoutInProgress = true;
  clearAuthState();

  notification.config({
    duration: 8,
    maxCount: 1,
  });
  notification.warning({
    key: 'session-expired',
    message: 'Session expired',
    description: sessionExpiredResponse.message,
  });

  if (window.location.pathname !== '/logout') {
    window.location.replace(SESSION_EXPIRED_LOGOUT_PATH);
  }

  return sessionExpiredResponse;
};

const errorHandler = (error) => {
  if (!navigator.onLine) {
    notification.config({
      duration: 15,
      maxCount: 1,
    });
    // Code to execute when there is internet connection
    notification.error({
      message: 'No internet connection',
      description: 'Cannot connect to the Internet, Check your internet network',
    });
    return {
      success: false,
      result: null,
      message: 'Cannot connect to the server, Check your internet network',
    };
  }

  const { response } = error;

  if (!response) {
    notification.config({
      duration: 20,
      maxCount: 1,
    });
    // Code to execute when there is no internet connection
    // notification.error({
    //   message: 'Problem connecting to server',
    //   description: 'Cannot connect to the server, Try again later',
    // });
    return {
      success: false,
      result: null,
      message: 'Cannot connect to the server, Contact your Account administrator',
    };
  }

  if (response && response.data && response.data.jwtExpired) {
    return handleSessionExpired();
  }

  if (response && response.status) {
    if (response?.data?.error?.name === 'JsonWebTokenError') {
      return handleSessionExpired();
    }

    const message = response.data && response.data.message;

    const errorText = message || codeMessage[response.status];
    const { status } = response;
    notification.config({
      duration: 20,
      maxCount: 2,
    });
    notification.error({
      message: `Request error ${status}`,
      description: errorText,
    });

    return response.data;
  } else {
    notification.config({
      duration: 15,
      maxCount: 1,
    });

    if (navigator.onLine) {
      // Code to execute when there is internet connection
      notification.error({
        message: 'Problem connecting to server',
        description: 'Cannot connect to the server, Try again later',
      });
      return {
        success: false,
        result: null,
        message: 'Cannot connect to the server, Contact your Account administrator',
      };
    } else {
      // Code to execute when there is no internet connection
      notification.error({
        message: 'No internet connection',
        description: 'Cannot connect to the Internet, Check your internet network',
      });
      return {
        success: false,
        result: null,
        message: 'Cannot connect to the server, Check your internet network',
      };
    }
  }
};

export default errorHandler;
