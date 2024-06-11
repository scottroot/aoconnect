import { errFrom } from "../utils.js";
import type { MessageContext } from "./upload-message.js";
import { buildData, buildTags } from "./upload-message.js";
import type { Logger } from "../../logger.js";
import type { LoadProcessMetaArgs } from "../../client/ao-su.js";
import type { DeployMessageArgs, DeployMessageReturn, RegisterProcessArgs } from "../../client/ao-mu.js";
import { deployMessageSchema, signerSchema } from "../../dal.js";
import type { Signer, Tag } from "../../types.js";


export interface GetMessageProps {
  loadProcessMeta: ({ suUrl, processId }: LoadProcessMetaArgs) => Promise<any>;
  deployMessage: (args: RegisterProcessArgs, ...args_1: unknown[]) => Promise<DeployMessageReturn>;
  logger: Logger;
}

export interface MessageFuncArgs {
  process: string;
  data: string;
  tags: Tag[];
  anchor: string;
  signer: Signer;
}

export type MessageFunc = (args: MessageFuncArgs) => Promise<DeployMessageReturn>;

export function getMessage(env: GetMessageProps): MessageFunc {
  const deployMessage = deployMessageSchema.implement(env.deployMessage);
  return async (ctx: MessageContext): Promise<DeployMessageReturn> => {
    try {
      const { process: processId, signer: _signer, ...restCtx } = ctx;
      if (!processId) throw "Missing process id";
      const signer = signerSchema.implement(_signer);

      const ctxWithTags: MessageContext = buildTags(restCtx);
      const ctxWithData: MessageContext = buildData(ctxWithTags, env.logger);

      const message: DeployMessageArgs = {
        ...ctxWithData,
        processId,
        signer: signerSchema.implement(signer),
      };
      const deployedMessage = await deployMessage(message);
      const messageResult = { ...ctx, messageId: deployedMessage.messageId };
      env.logger.tap('Deploy message result for process "%s": %O', processId)(messageResult);
      return deployedMessage;
    } catch (error) {
      throw errFrom(error);
    }
  };
}
