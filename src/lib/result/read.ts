import { loadResultSchema } from "../../dal.js";


interface Env {
  loadResult: (data: { id: string; processId: string }) => Promise<Record<string, any>>;
  loadState?: any;
}

interface Context {
  id: string;
  processId: string;
}

type Read = (ctx: Context) => Promise<Record<string, any>>;

export function readWith({ loadResult }: Env): Read {
  const validatedLoadResult = loadResultSchema.implement(loadResult);
  return async (ctx: Context): Promise<Record<string, any>> => {
    const data = { id: ctx.id, processId: ctx.processId };
    return validatedLoadResult(data);
  };
}
