import { verifyInput } from "./verify-input.js";
import type { Message, Result } from "../../client/ao-cu.ts";
import type { Logger } from "../../logger.js";
import type { Tag } from "../../types.js";
import { errFrom } from "../utils.js";
import { dryrunResultSchema } from "../../dal.js";


function coalesceMsg({ process, data, tags, anchor, ...rest }: DryrunFuncArgs): Message {
  return {
    Id: "1234",
    Owner: "1234",
    ...rest,
    Target: process,
    Data: data ?? "1234",
    Tags: tags ?? [],
    Anchor: anchor ?? "0",
  };
}

export interface GetDryrunProps {
  dryrunFetch: (msg: Message, ...args_1: unknown[]) => Promise<Result>;
  logger: Logger;
}

export type DryrunFunc = (args: DryrunFuncArgs) => any;

export interface DryrunFuncArgs {
  process: string;
  id?: string;
  owner?: string;
  target?: string;
  data?: string | ArrayBuffer;
  tags?: Tag[];
  anchor?: string;
}

export function getDryrun(env: GetDryrunProps): DryrunFunc {
  const dryrunFetch = dryrunResultSchema.implement(env.dryrunFetch);

  return async (args: DryrunFuncArgs) => {
    try {
      const msg = coalesceMsg(args);
      const verifiedInput = verifyInput(msg);
      return await dryrunFetch(verifiedInput);
    } catch (error) {
      throw errFrom(error);
    }
  };
}
