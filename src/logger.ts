import debug from "debug";


export interface Logger {
  (message: string, ...args: any[]): void;
  namespace: string;
  child: (name: string) => Logger;
  tap: (note: string, ...rest: any[]) => <T>(arg: T) => T;
}

export const createLogger = (name = "aoconnect-ts"): Logger => {
  const logger = debug(name) as unknown as Logger;
  logger.child = (childName: string): Logger => createLogger(`${logger.namespace}:${childName}`);
  logger.tap =
    (note: string, ...rest: any[]) =>
    <T>(arg: T): T => {
      logger(note, ...rest, arg);
      return arg;
    };

  return logger;
};
