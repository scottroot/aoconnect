import { deployAssignSchema } from "../../dal.js";
import type { AssignFuncArgs, GetAssignProps } from "./index.js";


export async function sendAssign(env: GetAssignProps, args: AssignFuncArgs): Promise<{ assignmentId: string }> {
  const deployAssign = deployAssignSchema.implement(env.deployAssign);
  const result = await deployAssign({
    process: args.process,
    message: args.message,
    baseLayer: args.baseLayer,
    exclude: args.exclude,
  });
  return { assignmentId: result.assignmentId };
}
