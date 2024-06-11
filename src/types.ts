import { z } from "zod/index.js";


export type Tag = {
  name: string;
  value: string;
};

export const tagSchema = z.object({
  name: z.string(),
  value: z.string(),
});

export const tagsSchema = z.array(tagSchema);

export type ParsedTags = Record<string, string[]>;

export type Signer = (args: { data: any; tags: any; target?: string; anchor?: string }) => Promise<any>;
