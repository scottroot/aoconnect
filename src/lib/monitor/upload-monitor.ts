import { deployMonitorSchema, signerSchema } from "../../dal";
import type { GetMonitor, MonitorFuncArgs } from "./index";


export async function uploadMonitor(env: GetMonitor, args: MonitorFuncArgs): Promise<{ monitorId: string }> {
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
