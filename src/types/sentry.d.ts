// Type definitions for Sentry global
interface SentryExtra {
  [key: string]: any;
}

interface SentryTags {
  [key: string]: string;
}

interface SentryUser {
  id: string;
  [key: string]: any;
}

interface SentryOptions {
  extra?: SentryExtra;
  tags?: SentryTags;
  user?: SentryUser;
}

interface Sentry {
  captureException(error: Error, options?: SentryOptions): void;
  captureMessage(message: string, options?: SentryOptions): void;
}

interface Window {
  Sentry?: Sentry;
}
