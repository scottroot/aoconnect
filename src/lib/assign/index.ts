import { errFrom } from "../utils";
import type { Logger } from "../../logger";
import { sendAssign } from "./send-assign";
import type { DeployAssignArgs, DeployAssignReturn } from "../../client/ao-mu";


export interface GetAssign {
  deployAssign: (args: DeployAssignArgs) => Promise<DeployAssignReturn>;
  logger: Logger;
}

export type AssignFunc = (args: AssignFuncArgs) => Promise<{ assignmentId: string }>;

export interface AssignFuncArgs {
  process: string;
  message: string;
  exclude?: string[];
  baseLayer?: boolean;
}

export function getAssign(env: GetAssign): AssignFunc {
  return async (args: AssignFuncArgs) => {
    try {
      return await sendAssign(env, args);
    } catch (error) {
      throw errFrom(error);
    }
  };
}
