import { deployMonitorSchema, signerSchema } from "../../dal";
import type { GetUnmonitor, UnmonitorFuncArgs, UnmonitorFuncReturn } from "./index.js";


export async function uploadUnmonitor(env: GetUnmonitor, args: UnmonitorFuncArgs): Promise<UnmonitorFuncReturn> {
  const deployUnmonitor = deployMonitorSchema.implement(env.deployUnmonitor);
  /**
   * No tags or data can be provided right now,
   * so just randomize data and set tags to an empty array
   */
  const deployMonitorResult = await deployUnmonitor({
    processId: args.process,
    signer: signerSchema.implement(args.signer),
    data: Math.random().toString().slice(-4),
    tags: [],
  });
  return { monitorId: deployMonitorResult.messageId };
}
