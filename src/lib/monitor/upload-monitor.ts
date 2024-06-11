import { deployMonitorSchema, signerSchema } from "../../dal.js";
import type { GetMonitorProps, MonitorFuncArgs } from "./index.js";


export async function uploadMonitor(env: GetMonitorProps, args: MonitorFuncArgs): Promise<{ monitorId: string }> {
  const deployMonitor = deployMonitorSchema.implement(env.deployMonitor);
  /**
   * No tags or data can be provided right now,
   * so just randomize data and set tags to an empty array
   */
  const deployMonitorResult = await deployMonitor({
    processId: args.process,
    signer: signerSchema.implement(args.signer),
    data: Math.random().toString().slice(-4),
    tags: [],
  });
  return { monitorId: deployMonitorResult.messageId };
}
