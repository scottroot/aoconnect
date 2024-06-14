import "arconnect";
import type {
  AppInfo,
  DispatchResult,
  GatewayConfig,
  PermissionType,
} from "arconnect";
import type { DataItemCreateOptions } from "warp-arbundles";
import type { SignatureOptions } from "arweave/web/lib/crypto/crypto-interface.js";
import type { JWKInterface } from "arweave/web/lib/wallet.js";
import type Transaction from "arweave/node/lib/transaction";


export type { JWKInterface };

export type Tag = {
  name: string;
  value: string;
};

export type AnyTag = {
  name: string;
  value?: any;
}

export type ParsedTags = Record<string, string[]>;

export type Signer = (args: { data: any; tags: any; target?: string; anchor?: string }) => Promise<any>;

export type ArweaveWallet = {
  /**
   * Name of the wallet the API was provided by.
   */
  walletName: string;

  /**
   * Connect to ArConnect and request permissions. This function can always be
   * called again if you want to request more permissions for your site.
   *
   * @param permissions
   * @param appInfo
   * @param gateway
   */
  connect(
    permissions: PermissionType[],
    appInfo?: AppInfo,
    gateway?: GatewayConfig
  ): Promise<void>;

  /**
   * Disconnect from ArConnect. Removes all permissions from your site.
   */
  disconnect(): Promise<void>;

  /**
   * Get the currently used wallet's address in the extension.
   *
   * @returns Promise of wallet address string
   */
  getActiveAddress(): Promise<string>;

  /**
   * Get all addresses added to the ArConnect extension
   *
   * @returns Promise of a list of the added wallets' addresses.
   */
  getAllAddresses(): Promise<string[]>;

  /**
   * Get wallet names for addresses.
   *
   * @returns Promise of an object with addresses and wallet names
   */
  getWalletNames(): Promise<{ [addr: string]: string }>;

  /**
   * Sign a transaction.
   *
   * @param transaction A valid Arweave transaction without a wallet keyfile added to it
   * @param options Arweave signing options
   *
   * @returns Promise of a signed transaction instance
   */
  sign(
    transaction: Transaction,
    options?: SignatureOptions
  ): Promise<Transaction>;

  signTransaction(tx: Transaction, options?: object | null): Promise<Transaction>;

  signDataItem(tx: DataItemCreateOptions & { data?: string | Uint8Array | NodeJS.ReadableStream }): Promise<ArrayBuffer>
  /**
   * Get the permissions allowed for you site by the user.
   *
   * @returns Promise of a list of permissions allowed for your dApp.
   */
  getPermissions(): Promise<PermissionType[]>;

  /**
   * Encrypt a string, using the user's wallet.
   *
   * @param data String to encrypt
   * @param options Encrypt options
   *
   * @returns Promise of the encrypted string
   */
  encrypt(
    data: string,
    options: {
      algorithm: string;
      hash: string;
      salt?: string;
    }
  ): Promise<Uint8Array>;

  /**
   * Decrypt a string encrypted with the user's wallet.
   *
   * @param data `Uint8Array` data to decrypt to a string
   * @param options Decrypt options
   *
   * @returns Promise of the decrypted string
   */
  decrypt(
    data: Uint8Array,
    options: {
      algorithm: string;
      hash: string;
      salt?: string;
    }
  ): Promise<string>;

  /**
   * Get the user's custom Arweave config set in the extension
   *
   * @returns Promise of the user's Arweave config
   */
  getArweaveConfig(): Promise<{
    host: string;
    port: number;
    protocol: "http" | "https";
  }>;

  /**
   * Get the signature for data array
   *
   * @param data `Uint8Array` data to get the signature for
   * @param algorithm
   *
   * @returns Promise of signature
   */
  signature(
    data: Uint8Array,
    // https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/sign#parameters
    algorithm: AlgorithmIdentifier | RsaPssParams | EcdsaParams
  ): Promise<Uint8Array>;

  /**
   * Get the user's active public key, from their wallet
   *
   * @returns Promise of the active public key
   */
  getActivePublicKey(): Promise<string>;

  /**
   * Add a token to ArConnect (if it is not already present)
   *
   * @param id Token contract ID
   */
  addToken(id: string): Promise<void>;

  /**
   * Dispatch an Arweave transaction (preferably bundled)
   *
   * @param transaction Transaction to dispatch
   * @returns Dispatched transaction ID and type
   */
  dispatch(transaction: Transaction): Promise<DispatchResult>;
};

/*
  See src/client/{browser,node}/wallet.ts
 */
export interface DataItemSignerArgs {
  data?: any;
  tags: Tag[];
  target?: string;
  anchor?: string;
}
export type DataItemSigner = (args: DataItemSignerArgs) => Promise<{ id: string; raw?: any }>;
