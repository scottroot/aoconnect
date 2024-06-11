import type { LoadProcessMetaArgs } from "../../client/ao-su.js";
import type { Signer, Tag } from "../../types.js";
import type { Logger } from "../../logger.js";
import { uploadUnmonitor } from "./upload-unmonitor.js";
import { errFrom } from "../utils.js";


export interface GetUnmonitorProps {
  loadProcessMeta: ({ suUrl, processId }: LoadProcessMetaArgs) => Promise<{ [p: string]: any; tags: Tag[] }>;
  deployUnmonitor: any;
  logger: Logger;
}

export interface UnmonitorFuncArgs {
  process: string;
  data: string;
  signer: Signer;
}

export type UnmonitorFunc = (args: UnmonitorFuncArgs) => any;
export type UnmonitorFuncReturn = {
  monitorId: string;
};

export function getUnmonitor(env: GetUnmonitorProps): UnmonitorFunc {
  return async (args: UnmonitorFuncArgs): Promise<UnmonitorFuncReturn> => {
    try {
      return await uploadUnmonitor(env, args);
    } catch (error) {
      throw errFrom(error);
    }
  };
}
