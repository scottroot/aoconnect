import { z } from "zod";
import { errFrom } from "../utils";
import type { Logger } from "../../logger";
import type { QueryResultsArgs, QueryResultsReturn } from "../../client/ao-cu";


export interface GetResults {
  queryResults: ({ process, from, to, sort, limit }: QueryResultsArgs, ...args_1: unknown[]) => Promise<QueryResultsReturn>;
  logger: Logger;
}

export type ResultsFunc = (args: QueryResultsArgs) => Promise<ResultsFuncReturn>;

export type ResultsFuncReturn = {
  edges: {
    cursor: string;
    node: {
      Output?: any;
      Messages?: any[];
      Spawns?: any[];
      Error?: any;
    };
  }[];
};

const inputSchema = z.object({
  process: z.string().min(1, { message: "process identifier is required" }),
  from: z.string().optional(),
  to: z.string().optional(),
  sort: z.enum(["ASC", "DESC"]).default("ASC"),
  limit: z.number().optional(),
});

const outputSchema = z.object({
  edges: z.array(
    z.object({
      cursor: z.string(),
      node: z.object({
        Output: z.any().optional(),
        Messages: z.array(z.any()).optional(),
        Spawns: z.array(z.any()).optional(),
        Error: z.any().optional(),
      }),
    }),
  ),
});

const queryResultsSchema = z.function().args(inputSchema).returns(z.promise(outputSchema));

export function getResults(env: GetResults): ResultsFunc {
  return async function (args: QueryResultsArgs): Promise<ResultsFuncReturn> {
    try {
      const verifiedInput = inputSchema.parse(args);
      const validatedQuery = queryResultsSchema.implement(env.queryResults);
      const queryResult = await validatedQuery(verifiedInput);
      env.logger.tap('readResults result for message "%s": %O', args.process)(queryResult);
      return queryResult;
    } catch (error) {
      throw errFrom(error);
    }
  };
}
