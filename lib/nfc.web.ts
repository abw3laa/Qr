export type NfcPayloadKind = "uri" | "text";

export async function isNfcSupported(): Promise<boolean> {
  return false;
}

export async function writeNdefPayload(): Promise<void> {
  throw new Error("NFC_UNSUPPORTED");
}

export async function readNdefPayload(): Promise<never> {
  throw new Error("NFC_UNSUPPORTED");
}
