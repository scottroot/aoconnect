import { loadResultSchema } from "../../dal";
import type { GetResult, ResultContext } from "./index";


export async function read({ loadResult }: GetResult, ctx: ResultContext): Promise<any> {
  const validatedLoadResult = loadResultSchema.implement(loadResult);
  return validatedLoadResult(ctx);
  // return async (ctx: Context): Promise<Record<string, any>> => {
  //   const data = { id: ctx.id, processId: ctx.processId };
  //   return validatedLoadResult(ctx);
  // };
}

// interface Env {
//   loadResult: (data: { id: string; processId: string }) => Promise<Record<string, any>>;
//   loadState?: any;
// }
// type Read = (ctx: Context) => Promise<Record<string, any>>;
//
// export function readWith({ loadResult }: Env): Read {
//   const validatedLoadResult = loadResultSchema.implement(loadResult);
//   return async (ctx: Context): Promise<Record<string, any>> => {
//     const data = { id: ctx.id, processId: ctx.processId };
//     return validatedLoadResult(data);
//   };
// }
