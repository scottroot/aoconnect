import "arconnect";
// import { createData, ArweaveSigner } from "arbundles/node";
// import type { JWKInterface , Signer } from "arbundles/node";
// import type { DataItem, Tag } from "arbundles";
// import { createData, ArweaveSigner } from "warp-arbundles";
import * as WarpArbundles from "warp-arbundles";
// import type { JWKInterface , Signer } from "warp-arbundles/";
import type { Signer } from "warp-arbundles";
import type { JWKInterface, DataItemSigner } from "../../types";


const { createData, ArweaveSigner } = WarpArbundles;

// export interface DataItemSignerArgs {
//   data: any;
//   tags: Tag[];
//   target: string;
//   anchor: string;
//   createDataItem: (_: any) => DataItem;
// }
//
// export type DataItemSigner = (args: DataItemSignerArgs) => Promise<{ id: string; raw: any }>;

/**
 * A function that builds a signer using a wallet jwk interface
 * commonly used in node-based dApps
 *
 * This is provided as a convenience for consumers of the SDK
 * to use, but consumers can also implement their own signer
 *
 * @returns {Types['signer']}
 */
export function createDataItemSigner (wallet: JWKInterface): DataItemSigner {
  return async({ data, tags, target, anchor }) => {
    const signer: Signer = new ArweaveSigner(wallet);
    const dataItem = createData(data, signer, { tags, target, anchor });
    await dataItem.sign(signer);
    return {
      id: await dataItem.id,
      raw: await dataItem.getRaw(),
    };
  };
}
