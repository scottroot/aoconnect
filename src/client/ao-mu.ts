import type { Logger } from "../logger";
import type { DataItemSigner, Tag } from "../types";


export interface MUEnv {
  fetch: (url: string, options: RequestInit) => Promise<Response>;
  MU_URL: string;
  logger: Logger;
}

// export interface DeployMessageArgs {
//   processId: string;
//   data: any;
//   tags: any;
//   anchor: string;
//   signer: Signer;
// }
export type DeployMessageArgs = {
  processId: string;
  // tags: {
  //   value: string;
  //   name: string;
  // }[];
  tags: Tag[];
  data?: any;
  anchor?: string | undefined;
  signer: any;
}
export type DeployMessageReturn = {
  messageId: string;
};

export class DeployMessage {
  private fetch: (url: string, options: RequestInit) => Promise<Response>;
  private MU_URL: string;
  private logger: Logger;

  constructor({ fetch, MU_URL, logger }: MUEnv) {
    this.fetch = fetch;
    this.MU_URL = MU_URL;
    this.logger = logger.child('deployMessage');
  }

  // async execute(args: WriteMessage2Args): Promise<Record<string, any>> {
  async execute(args: DeployMessageArgs): Promise<DeployMessageReturn> {
    try {
      const { processId, data, tags, anchor, signer } = args;
      const signedDataItem = await signer({ data, tags, target: processId, anchor });
      this.logger.tap('Signing data')({ processId, data, tags, anchor });
      const response = await this.fetch(this.MU_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          Accept: 'application/json',
        },
        redirect: 'follow',
        body: signedDataItem.raw,
      });
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.tap('Error encountered when writing message via MU')(errorText);
        throw new Error(`Error while communicating with MU: ${response.status}: ${errorText}`);
      }

      const responseData = await response.json();
      this.logger.tap('Successfully wrote message via MU')(responseData);
      // return { res: responseData, messageId: signedDataItem.id };
      return { messageId: signedDataItem.id };
    } catch (error) {
      this.logger.tap('Error')(error);
      throw error;
    }
  }
}


export interface DeployProcessArgs {
  // processId: string;
  data?: any;
  tags: Tag[];
  anchor?: string;
  signer: DataItemSigner;
}

export type DeployProcessReturn = {
  processId: string;
};

export class DeployProcess {
  private fetch: (url: string, options: RequestInit) => Promise<Response>;
  private MU_URL: string;
  private logger: Logger;

  constructor({ fetch, MU_URL, logger }: MUEnv) {
    this.fetch = fetch;
    this.MU_URL = MU_URL;
    this.logger = logger.child('deployProcess');
  }

  async execute(args: DeployProcessArgs): Promise<DeployProcessReturn> {
    try {
      const { data, tags, signer } = args;
      const signedDataItem = await signer({ data, tags });
      this.logger.tap('Signing data')({ data, tags });
      const response = await this.fetch(this.MU_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          Accept: 'application/json',
        },
        redirect: 'follow',
        body: signedDataItem.raw,
      });
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.tap('Error encountered when deploying process via MU')(errorText);
        throw new Error(`Error while communicating with MU: ${response.status}: ${errorText}`);
      }
      const responseData = await response.json();
      this.logger.tap('Successfully deployed process via MU')(responseData);
      // return { res: responseData, processId: signedDataItem.id };
      return { processId: signedDataItem.id };
    } catch (error) {
      this.logger.tap('Error')(error);
      throw error;
    }
  }
}


export interface DeployMonitorArgs {
  processId: string;
  data?: any;
  tags: any;
  anchor?: string;
  signer: DataItemSigner;
}
export type DeployMonitorResult = {
  // res: any;
  messageId: string;
}

export class DeployMonitor {
  private fetch: (url: string, options: RequestInit) => Promise<Response>;
  private MU_URL: string;
  private logger: Logger;

  constructor({ fetch, MU_URL, logger }: MUEnv) {
    this.fetch = fetch;
    this.MU_URL = MU_URL;
    this.logger = logger.child('deployMonitor');
  }

  async execute(args: DeployMonitorArgs): Promise<DeployMonitorResult> {
    try {
      const { processId, data, tags, anchor, signer } = args;
      const signedDataItem = await signer({ data, tags, target: processId, anchor });
      this.logger.tap('Signing data')({ processId, data, tags, anchor });
      const response = await this.fetch(`${this.MU_URL}/monitor/${processId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          Accept: 'application/json',
        },
        redirect: 'follow',
        body: signedDataItem.raw,
      });
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.tap('Error encountered when subscribing to process via MU')(errorText);
        throw new Error(`Error while communicating with MU: ${response.status}: ${errorText}`);
      }
      const responseData = { ok: true };
      this.logger.tap('Successfully subscribed to process via MU')(responseData);
      // return { res: responseData, messageId: signedDataItem.id };
      return { messageId: signedDataItem.id };
    } catch (error) {
      this.logger.tap('Error')(error);
      throw error;
    }
  }
}

export interface DeployUnmonitorArgs {
  processId: string;
  data?: any;
  tags: Tag[];
  anchor?: string;
  signer: DataItemSigner;
}
export type DeployUnmonitorReturn = {
  messageId: string;
};

export class DeployUnmonitor {
  private fetch: (url: string, options: RequestInit) => Promise<Response>;
  private MU_URL: string;
  private logger: Logger;

  constructor({ fetch, MU_URL, logger }: MUEnv) {
    this.fetch = fetch;
    this.MU_URL = MU_URL;
    this.logger = logger.child('deployUnmonitor');
  }

  async execute(args: DeployUnmonitorArgs): Promise<DeployUnmonitorReturn> {
    try {
      const { processId, data, tags, anchor, signer } = args;
      const signedDataItem = await signer({ data, tags, target: processId, anchor });
      this.logger.tap('Signing data')({ processId, data, tags, anchor });
      const response = await this.fetch(`${this.MU_URL}/monitor/${processId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/octet-stream',
          Accept: 'application/json',
        },
        redirect: 'follow',
        body: signedDataItem.raw,
      });
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.tap('Error encountered when unsubscribing to process via MU')(errorText);
        throw new Error(`Error while communicating with MU: ${response.status}: ${errorText}`);
      }
      const responseData = { ok: true };
      this.logger.tap('Successfully unsubscribed to process via MU')(responseData);
      // return { res: responseData, messageId: signedDataItem.id };
      return { messageId: signedDataItem.id };
    } catch (error) {
      this.logger.tap('Error')(error);
      throw error;
    }
  }
}


export interface DeployAssignArgs {
  process: string;
  message: string;
  exclude?: string[];
  baseLayer?: boolean;
}
// export type DeployAssignReturn = { res: any, assignmentId: string };
export type DeployAssignReturn = { assignmentId: string };

export class DeployAssign {
  private fetch: (url: string, options: RequestInit) => Promise<Response>;
  private MU_URL: string;
  private logger: Logger;

  constructor({ fetch, MU_URL, logger }: MUEnv) {
    this.fetch = fetch;
    this.MU_URL = MU_URL;
    this.logger = logger.child('deployAssign');
  }

  async execute(args: DeployAssignArgs): Promise<DeployAssignReturn> {
    try {
      const { process, message, baseLayer, exclude } = args;
      // const url = `${this.MU_URL}?process-id=${process}&assign=${message}${baseLayer ? '&base-layer' : ''}${exclude ? '&exclude=' + exclude.join(',') : ''}`;
      const maybeBaseLayer = baseLayer ? "&base-layer" : "";
      const maybeExclude = exclude ? "&exclude=" + exclude.join(",") : "";
      const url = [this.MU_URL, "?", `process-id=${process}`, "&", `assign=${message}`, maybeBaseLayer, maybeExclude].join("");
      const response = await this.fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/octet-stream',
          Accept: 'application/json',
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.tap('Error encountered when writing assignment via MU')(errorText);
        throw new Error(`Error while communicating with MU: ${response.status}: ${errorText}`);
      }
      const responseData = await response.json();
      this.logger.tap('Successfully wrote assignment via MU')(responseData);
      // return { res: responseData, assignmentId: responseData.id };
      return { assignmentId: responseData.id };
    } catch (error) {
      this.logger.tap('Error')(error);
      throw error;
    }
  }
}
