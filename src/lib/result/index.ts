import { z } from "zod";
import { errFrom } from "../utils";
import { read } from "./read";
import type { Logger } from "../../logger";
import type { LoadResultParams } from "../../client/ao-cu";


const inputSchema = z.object({
  id: z.string().min(1, { message: "message is required to be a message id" }),
  processId: z.string().min(1, { message: "process is required to be a process id" }),
});

export function verifyInput(ctx: any): any {
  try {
    inputSchema.parse(ctx);
    return ctx;
  } catch (error: any) {
    console.log(`Error verifying input: ${error}\n${JSON.stringify({ ctx })}`);
  }

}

interface MessageResult {
  Output: any;
  Messages: any[];
  Spawns: any[];
  Error?: any;
}

export interface ResultFuncArgs {
  message: string;
  process: string;
}
export type ResultContext = {
  id: string;
  processId: string;
}

export type ResultFunc = (args: ResultFuncArgs) => Promise<MessageResult>;

export interface GetResult {
  loadResult: ({ id, processId }: LoadResultParams) => Promise<any>;
  logger: Logger;
}

export function getResult(env: GetResult): ResultFunc {
  return async (args: ResultFuncArgs): Promise<MessageResult> => {
    try {
      console.log(`getResult, args = ${JSON.stringify(args)}`);
      const ctx: ResultContext = { id: args.message, processId: args.process };
      inputSchema.parse(ctx);

      // let result = await verifyInput(ctx);
      // result = read(env, args);
      const result = await read(env, ctx);

      env.logger.tap('readResult result for message "%s": %O', result);

      return result;
    } catch (error) {
      throw errFrom(error);
    }
  };
}
