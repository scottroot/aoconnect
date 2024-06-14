import type { Tag } from "../types";


export interface CUEnv {
  fetch: (url: string, options: RequestInit) => Promise<Response>;
  CU_URL: string;
  logger: { tap: (message: string) => (msg: any) => any };
}

export type Message = {
  Id: string;
  Target: string;
  Owner: string;
  Anchor?: string;
  Data?: any;
  Tags: Tag[]
}
export type Result = {
  Output: any;
  Messages: Message[];
  Spawns: Message[];
  Error: string;
}

export class DryrunFetch {
  private fetch: (url: string, options: RequestInit) => Promise<Response>;
  private CU_URL: string;
  private logger: { tap: (message: string) => (msg: any) => any };

  constructor({ fetch, CU_URL, logger }: CUEnv) {
    this.fetch = fetch;
    this.CU_URL = CU_URL;
    this.logger = logger;
  }

  async execute(msg: Message): Promise<Result> {
    this.logger.tap('posting dryrun request to CU')(msg);
    const response = await this.fetch(`${this.CU_URL}/dry-run?process-id=${msg.Target}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      redirect: 'follow',
      body: JSON.stringify(msg),
    });
    return await response.json();
  }
}

export interface LoadResultParams {
  id: string;
  processId: string;
}

export class LoadResult {
  private fetch: (url: string, options: RequestInit) => Promise<Response>;
  private CU_URL: string;
  private logger: { tap: (message: string) => (msg: any) => any };

  constructor({ fetch, CU_URL, logger }: CUEnv) {
    this.fetch = fetch;
    this.CU_URL = CU_URL;
    this.logger = logger;
  }

  async execute({ id, processId }: LoadResultParams): Promise<any> {
    const url = `${this.CU_URL}/result/${id}?process-id=${processId}`;
    this.logger.tap('fetching message result from CU')(url);
    const response = await this.fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      redirect: 'follow',
    });
    return await response.json();
  }
}


export interface QueryResultsArgs {
  // process: string;
  // from?: string;
  // to?: string;
  // sort?: string;
  // limit?: number;
  process: string;
  from?: string | undefined;
  to?: string | undefined;
  sort?: "ASC" | "DESC" | undefined;
  limit?: number | undefined;
}
export type QueryResultsReturn = {
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


export class QueryResults {
  private fetch: (url: string, options: RequestInit) => Promise<Response>;
  private CU_URL: string;
  private logger: { tap: (message: string) => (msg: any) => any };

  constructor({ fetch, CU_URL, logger }: CUEnv) {
    this.fetch = fetch;
    this.CU_URL = CU_URL;
    this.logger = logger;
  }

  async execute({ process, from, to, sort, limit }: QueryResultsArgs): Promise<QueryResultsReturn> {
    const target = new URL(`${this.CU_URL}/results/${process}`);
    const params = new URLSearchParams(target.search);

    if (from) {
      params.append('from', from);
    }
    if (to) {
      params.append('to', to);
    }
    if (sort) {
      params.append('sort', sort);
    }
    if (limit) {
      params.append('limit', limit.toString());
    }
    target.search = params.toString();
    this.logger.tap('fetching message result from CU')(target.toString());
    const response = await this.fetch(target.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      redirect: 'follow',
    });
    return await response.json();
  }
}
