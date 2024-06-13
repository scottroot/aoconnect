import { errFrom } from "../utils";
import { uploadMonitor } from "./upload-monitor";
import type { DataItemSigner, Tag } from "../../types";
import type { Logger } from "../../logger";
import type { DeployMonitorArgs, DeployMonitorResult } from "../../client/ao-mu";
import type { LoadProcessMetaArgs } from "../../client/ao-su";


export interface GetMonitor {
  loadProcessMeta: ({ suUrl, processId }: LoadProcessMetaArgs) => Promise<{ [p: string]: any; tags: Tag[] }>;
  deployMonitor: (args: DeployMonitorArgs, ...args_1: unknown[]) => Promise<DeployMonitorResult>;
  logger: Logger;
}

export interface MonitorFuncArgs {
  process: string;
  data?: string;
  signer: DataItemSigner;
}

export type MonitorFunc = (ctx: MonitorFuncArgs) => any;

export function getMonitor(env: GetMonitor): MonitorFunc {
  return async (args: MonitorFuncArgs) => {
    try {
      return await uploadMonitor(env, args);
    } catch (error) {
      throw errFrom(error);
    }
  };
}
