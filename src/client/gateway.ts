import { z } from "zod";
import type { Logger } from "../logger";
import type { Tag } from "../types";
import { errFrom } from "../lib/utils";


export const transactionConnectionSchema = z.object({
  data: z.object({
    transactions: z.object({
      edges: z.array(z.object({
        node: z.record(z.any())
      }))
    })
  })
});

export type GraphqlResult = {
  data: {
    transactions: {
      edges: {
        node: {
          owner: {
            address: string;
          };
          tags: {
            name: "Data-Protocol" | "Variant" | "Type" | "Module" | "Scheduler" | "SDK" | "Content-Type" | string;
            value: string;
          }[];
          block: {
            id: string;
            height: number;
            timestamp: number;
          };
        };
      }[];
    };
  };
};

export interface LoadTransactionMetaArgs {
  fetch: (url: string, options: RequestInit) => Promise<Response>;
  GRAPHQL_URL: string;
  logger: Logger;
}

/*
 @param id - the id of the contract whose src is being loaded
 */
// export type LoadTransactionMetaFunc = (id: string) => Promise<LoadTransactionMetaFuncReturn>;

// export type LoadTransactionMetaFuncReturn = z.infer<typeof transactionConnectionSchema>['data']['transactions']['edges'][number]['node'];
export type LoadTransactionMetaFuncReturn = {tags: Tag[], [key: string]: any};


// export function loadTransactionMeta ({ fetch, GRAPHQL_URL, logger }: LoadTransactionMetaProps): LoadTransactionMetaFunc {
//   const GET_TRANSACTIONS_QUERY = `
//     query GetTransactions ($transactionIds: [ID!]!) {
//       transactions(ids: $transactionIds) {
//         edges {
//           node {
//             owner {
//               address
//             }
//             tags {
//               name
//               value
//             }
//             block {
//               id
//               height
//               timestamp
//             }
//           }
//         }
//       }
//     }`;
//
//   return async function(id: string): Promise<LoadTransactionMetaFuncReturn> {
//     const graphqlResponse = await fetch(GRAPHQL_URL, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         query: GET_TRANSACTIONS_QUERY,
//         variables: { transactionIds: [id] }
//       })
//     });
//     if (!graphqlResponse.ok) {
//       logger('Error Encountered when querying gateway for transaction "%s"', id);
//       throw new Error(`${graphqlResponse.status}: ${await graphqlResponse.text()}`);
//     }
//     const graphqlResponseJson = await graphqlResponse.json();
//     const transaction = transactionConnectionSchema.parse(graphqlResponseJson);
//     return transaction.data.transactions.edges[0].node;
//   };
// }

export class LoadTransactionMeta {
  private logger: (message: string, ...args: any[]) => void;
  private fetch: (url: string, options: RequestInit) => Promise<Response>;
  private GRAPHQL_URL: string;
  private query_template: string;

  constructor({ logger, fetch, GRAPHQL_URL }: LoadTransactionMetaArgs) {
    this.logger = logger;
    this.fetch = fetch;
    this.GRAPHQL_URL = GRAPHQL_URL;
    this.query_template = `
    query GetTransactions ($transactionIds: [ID!]!) {
      transactions(ids: $transactionIds) {
        edges {
          node {
            owner {
              address
            }
            tags {
              name
              value
            }
            block {
              id
              height
              timestamp
            }
          }
        }
      }
    }`;
  }

  async execute(id: string): Promise<LoadTransactionMetaFuncReturn> {
    try {
      const response = await this.fetch(this.GRAPHQL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: this.query_template,
          variables: { transactionIds: [id] }
        })
      });
      if (!response.ok) {
        this.logger('Error Encountered when querying gateway for transaction "%s"', id);
        throw new Error(`${response.status}: ${await response.text()}`);
      }
      const graphqlResponseJson = await response.json();
      const transaction = transactionConnectionSchema.parse(graphqlResponseJson);
      return transaction.data.transactions.edges[0].node as LoadTransactionMetaFuncReturn;
    } catch (error: any) {
      this.logger("Error: %s", error.message);
      throw errFrom(error);
    }
  }
}
