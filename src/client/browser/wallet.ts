import "arconnect";
import { Buffer } from "buffer";
import type { ArweaveWallet, DataItemSigner } from "../../types";
import { DataItem } from "warp-arbundles";


if (!globalThis.Buffer) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  globalThis.Buffer = Buffer;
}

/**
 * A function that builds a signer using the global arweaveWallet
 * commonly used in browser-based dApps
 *
 * @param {ArweaveWallet} arweaveWallet - The window.arweaveWallet object
 * @returns {Types['signer']} - The signer function
 * @example
 * const signer = createDataItemSigner(window.arweaveWallet)
 *
 */
// export interface CreateDataItemSignerArgs {
//   data: any;
//   tags: Tag[];
//   target: string;
//   anchor: string;
//   // createDataItem: (_: any) => DataItem;
// }
//
// export type CreateDataItemSigner = (args: CreateDataItemSignerArgs) => Promise<{ id: string; raw: any }>;

export function createDataItemSigner(arweaveWallet: ArweaveWallet): DataItemSigner {
  const createDataItem = (buf: any): DataItem => new DataItem(buf);
  return async({ data, tags, target, anchor })  => {
  /**
   * signDataItem interface according to ArweaveWalletConnector
   *
   * https://github.com/jfbeats/ArweaveWalletConnector/blob/7c167f79cd0cf72b6e32e1fe5f988a05eed8f794/src/Arweave.ts#L46C23-L46C23
   */
  const view = await arweaveWallet.signDataItem({ data, tags, target, anchor });
  const dataItem = createDataItem(Buffer.from(view));
  return {
    id: await dataItem.id,
    raw: dataItem.getRaw(),
  };
};
}
