import type { LoadProcessMetaArgs } from "../../client/ao-su";
import type { DataItemSigner, Tag } from "../../types";
import type { Logger } from "../../logger";
import { uploadUnmonitor } from "./upload-unmonitor";
import { errFrom } from "../utils";
import type { DeployMonitorResult, DeployUnmonitorArgs } from "client/ao-mu";


export type UnmonitorFunc = (args: UnmonitorFuncArgs) => Promise<UnmonitorFuncReturn>;

export interface UnmonitorFuncArgs { process: string;data: string;signer: DataItemSigner; }

export type UnmonitorFuncReturn = { monitorId: string; };

export interface GetUnmonitor {
  loadProcessMeta: ({ suUrl, processId }: LoadProcessMetaArgs) => Promise<{ [p: string]: any; tags: Tag[]; }>;
  deployUnmonitor: (args: DeployUnmonitorArgs) => Promise<DeployMonitorResult>;
  logger: Logger;
}

export function getUnmonitor(env: GetUnmonitor): UnmonitorFunc {
  return async (args: UnmonitorFuncArgs): Promise<UnmonitorFuncReturn> => {
    try {
      return await uploadUnmonitor(env, args);
    } catch (error) {
      throw errFrom(error);
    }
  };
}
