import { errFrom } from "../utils.js";
import { readWith } from "./read.js";
import { z } from "zod";
import type { Logger } from "../../logger.js";
import type { LoadResultParams } from "../../client/ao-cu.js";


const inputSchema = z.object({
  id: z.string().min(1, { message: "message is required to be a message id" }),
  processId: z.string().min(1, { message: "process is required to be a process id" }),
});

export function verifyInput(ctx: any): any {
  inputSchema.parse(ctx);
  return ctx;
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

export type ResultFunc = (args: ResultFuncArgs) => Promise<MessageResult>;

export interface GetResultProps {
  loadResult: ({ id, processId }: LoadResultParams) => Promise<any>;
  logger: Logger;
}

export function getResult(_env: GetResultProps): ResultFunc {
  const env = verifyInput(_env);
  const read = readWith(env);

  return async ({ message, process }: ResultFuncArgs): Promise<MessageResult> => {
    try {
      let result: any = { id: message, processId: process };

      result = await verifyInput(result);
      result = await read(result);

      env.logger.tap('readResult result for message "%s": %O', message)(result);

      return result;
    } catch (error) {
      throw errFrom(error);
    }
  };
}
