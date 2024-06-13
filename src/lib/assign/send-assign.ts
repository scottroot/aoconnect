import { deployAssignSchema } from "../../dal";
import type { AssignFuncArgs, GetAssign } from "./index";
import type { DeployAssignReturn } from "client/ao-mu";


export async function sendAssign(env: GetAssign, args: AssignFuncArgs): Promise<DeployAssignReturn> {
  const deployAssign = deployAssignSchema.implement(env.deployAssign);
  const result = await deployAssign({
    process: args.process,
    message: args.message,
    baseLayer: args.baseLayer,
    exclude: args.exclude,
  });
  return { assignmentId: result.assignmentId };
}
