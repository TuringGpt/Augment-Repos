import { notification } from 'antd';
import codeMessage from './codeMessage';

// Module-level guard: once an auth-expiry has been detected on the current
// page, suppress duplicate logout redirects and notification spam from
// concurrent in-flight requests that all fail with the same expired-cookie
// response. Reset on the next full page load.
let isHandlingAuthExpiry = false;

const handleAuthExpiry = () => {
  if (isHandlingAuthExpiry) return;
  isHandlingAuthExpiry = true;

  window.localStorage.removeItem('auth');
  window.localStorage.removeItem('isLogout');

  notification.config({ duration: 6, maxCount: 1 });
  notification.error({
    message: 'Session expired',
    description: 'Your session has expired. Please sign in again to continue.',
  });

  window.location.href = '/logout';
};

const errorHandler = (error) => {
  // Swallow any further errors once the auth-expiry flow has started; the
  // page is about to navigate away and additional toasts/redirects would
  // only confuse the user.
  if (isHandlingAuthExpiry) {
    return {
      success: false,
      result: null,
      message: 'Session expired',
    };
  }

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

  const isJwtExpired = response?.data?.jwtExpired;
  const isJwtError = response?.data?.error?.name === 'JsonWebTokenError';
  if (isJwtExpired || isJwtError) {
    handleAuthExpiry();
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
