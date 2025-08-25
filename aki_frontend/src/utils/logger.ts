import * as Sentry from "@sentry/react";
import ReactGA from "react-ga4";

/**
 * Console Logger (Default Logger) - Logs to Default Console
 * @param message
 * @param useErrorType
 */
const __console = (message: string, useErrorType: boolean = false) => {
  useErrorType ? console.error(message) : console.log(message);
};

/**
 * Alert Logger - Creates Alerts to Log
 * @param message
 */
const __alert = (message: string) => {
  window.alert(message);
};

/**
 * Dev Logger - Logger to log development messages
 * NOTE : This logger only produces output when the environment is development
 * @param message
 * @param useErrorType
 */
const __dev = (message: string, useErrorType: boolean = false) => {
  if (import.meta.env.DEV) {
    __console("[DEV] " + message, useErrorType);
  }
};

/**
 * Exception Logger - Logger to log exceptions.
 * IN DEVELOPMENT MODE - Logs message & Exception to console
 * IN PRODUCTION MODE - Logs message to console (Use this logger to send exceptions to Sentry)
 * @param message
 * @param error
 * @param doAlert
 */

const __exception = (message: string, error: any, doAlert: boolean = false) => {
  if (doAlert) __alert(message);
  if (import.meta.env.DEV) {
    __console("[Exception Handler] An Error was reported", true);
    __console(message, true);
    __console(error, true);
    console.trace();
  }
  if (import.meta.env.PROD) {
    Sentry.captureException(error);
    Sentry.captureMessage(message);
    ReactGA.ga("event", "exception", {
      path: window.location,
      message: message,
      error: error,
      alerted: doAlert,
    });
  }
};

/**
 * Logger
 * Provides Global Methods for Logging
 * @author: Jiho Park
 */
const logger = {
  console: __console,
  alert: __alert,
  dev: __dev,
  exception: __exception,
};

export default logger;
