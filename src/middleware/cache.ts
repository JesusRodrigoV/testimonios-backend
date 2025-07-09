import apicache from "apicache";

const cache = apicache.middleware;
const onlyStatus200 = (req: any, res: any) => res.statusCode === 200;
const defaultDuration = "5 minutes";

export const publicCache = (duration: string = "30 minutes") =>
  cache(duration, onlyStatus200);

export const authCache = (duration: string = defaultDuration) =>
  cache(duration, onlyStatus200);

export const clearCache =
  (keys: string[]) => (req: any, res: any, next: any) => {
    keys.forEach((key) => apicache.clear(key));
    next();
  };
