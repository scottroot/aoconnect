const hack = (): void => {
  throw new Error(`Unimplemented`);
};
// @ts-expect-error hack to stop arweave-js's check for sublteCrypto
globalThis.crypto ??= {};
// @ts-expect-error hack to stop arweave-js's check for sublteCrypto
globalThis.crypto.subtle ??= {};
// @ts-expect-error hack to stop arweave-js's check for sublteCrypto
globalThis.crypto.subtle.generateKey ??= hack;
// @ts-expect-error hack to stop arweave-js's check for sublteCrypto
globalThis.crypto.subtle.importKey ??= hack;
// @ts-expect-error hack to stop arweave-js's check for sublteCrypto
globalThis.crypto.subtle.exportKey ??= hack;
// @ts-expect-error hack to stop arweave-js's check for sublteCrypto
globalThis.crypto.subtle.digest ??= hack;
// @ts-expect-error hack to stop arweave-js's check for sublteCrypto
globalThis.crypto.subtle.sign ??= hack;

export default hack;