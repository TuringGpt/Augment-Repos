import { notification } from 'antd';
import codeMessage from './codeMessage';

// Re-entry guard: once we've started handling an expired session, swallow any
// further auth errors from concurrent in-flight requests so the user does not
// get a wall of toasts or land in a redirect loop.
let isHandlingAuthExpiration = false;

const handleAuthExpiration = () => {
  if (isHandlingAuthExpiration) return;
  isHandlingAuthExpiration = true;
  window.localStorage.removeItem('auth');
  window.localStorage.removeItem('isLogout');
  // Flag for AuthRouter to surface a single user-friendly message after the
  // hard reload (antd toasts do not survive a window.location navigation).
  window.sessionStorage.setItem('sessionExpired', '1');
  window.location.href = '/logout';
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

  // Treat expired/invalid tokens as a single event: dispatch one logout,
  // suppress the generic per-request error toast, and return early so
  // concurrent 401 responses do not stack notifications or redirects.
  // Gate on HTTP 401 — the backend auth middleware's catch block also sets
  // `jwtExpired: true` on 500 responses for unrelated internal failures, and
  // those must still surface through the generic error notification path.
  const isExpiredAuth =
    response.status === 401 &&
    ((response.data && response.data.jwtExpired) ||
      response?.data?.error?.name === 'JsonWebTokenError');

  if (isExpiredAuth) {
    handleAuthExpiration();
    return {
      success: false,
      result: null,
      message: 'Session expired',
    };
  }

  if (response && response.status) {
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
