import { removeTagsByNameMaybeValue } from "../utils.js";
import type { Logger } from "../../logger.js";
import type { Tag } from "../../types.js";
import { tagsSchema } from "../../types.js";


export interface MessageContext {
  tags: Tag[];
  data?: any;
  process?: string;
  anchor?: string;
  signer?: any;
}

export function buildTags(ctx: MessageContext): MessageContext {
  const { tags, ...rest } = ctx;
  const tagsToRemove = [{ name: "Data-Protocol", value: "ao" }, { name: "Variant" }, { name: "Type" }, { name: "SDK" }];
  let newTags = tagsToRemove.reduce((acc: Tag[], tag: { name: string; value?: string }) => {
    return removeTagsByNameMaybeValue(acc, tag);
  }, tags || []);

  newTags = [
    ...newTags,
    { name: "Data-Protocol", value: "ao" },
    { name: "Variant", value: "ao.TN.1" },
    { name: "Type", value: "Message" },
    { name: "SDK", value: "aoconnect" },
  ];

  newTags = tagsSchema.parse(newTags);

  return {
    ...rest,
    tags: newTags,
  };
}

export function buildData(ctx: MessageContext, logger: Logger): MessageContext {
  if (ctx.data) return ctx;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data, tags, ...rest } = ctx;
  const newData = Math.random().toString().slice(-4);
  const newTags = removeTagsByNameMaybeValue(tags, { name: "Content-Type" });
  newTags.push({ name: "Content-Type", value: "text/plain" });
  logger.tap(`added pseudo-random string as message "data"`);
  return {
    ...rest,
    data: newData,
    tags: newTags,
  };
}
