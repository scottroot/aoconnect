import { z } from "zod";
import type { Message } from "../../client/ao-cu.ts";


const inputSchema = z.object({
  Id: z.string(),
  Target: z.string(),
  Owner: z.string(),
  Anchor: z.string().optional(),
  Data: z.any().default("1234"),
  Tags: z.array(z.object({ name: z.string(), value: z.string() })),
});

export function verifyInput(msg: Message): Message {
  const validatedMsg = inputSchema.parse(msg);
  const newTags = [
    ...validatedMsg.Tags,
    { name: "Data-Protocol", value: "ao" },
    { name: "Type", value: "Message" },
    { name: "Variant", value: "ao.TN.1" },
  ];
  return {
    ...validatedMsg,
    Tags: newTags,
    Anchor: validatedMsg.Anchor ?? "ABCD",
    Data: validatedMsg.Data ?? Math.random().toString().slice(-4),
  };
}
