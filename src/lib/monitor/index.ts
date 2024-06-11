import { errFrom } from "../utils.js";
import { uploadMonitor } from "./upload-monitor.js";
import type { Signer, Tag } from "../../types.js";
import type { Logger } from "../../logger.js";
import type { DeployMonitorArgs, DeployMonitorResult } from "../../client/ao-mu.js";
import type { LoadProcessMetaArgs } from "../../client/ao-su.js";


export interface GetMonitorProps {
  loadProcessMeta: ({ suUrl, processId }: LoadProcessMetaArgs) => Promise<{ [p: string]: any; tags: Tag[] }>;
  deployMonitor: (args: DeployMonitorArgs, ...args_1: unknown[]) => Promise<DeployMonitorResult>;
  logger: Logger;
}

export interface MonitorFuncArgs {
  process: string;
  data: string;
  signer: Signer;
}

export type MonitorFunc = (ctx: MonitorFuncArgs) => any;

export function getMonitor(env: GetMonitorProps): MonitorFunc {
  return async (args: MonitorFuncArgs) => {
    try {
      return await uploadMonitor(env, args);
    } catch (error) {
      throw errFrom(error);
    }
  };
}
