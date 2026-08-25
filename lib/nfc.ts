import NfcManager, { Ndef, NfcTech } from "react-native-nfc-manager";
import { Platform } from "react-native";

export type NfcPayloadKind = "uri" | "text";

export async function isNfcSupported(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    return await NfcManager.isSupported();
  } catch {
    return false;
  }
}

export async function writeNdefPayload(payload: string, kind: NfcPayloadKind): Promise<void> {
  if (!(await isNfcSupported())) throw new Error("NFC_UNSUPPORTED");
  await NfcManager.start();
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const record = kind === "uri" ? Ndef.uriRecord(payload) : Ndef.textRecord(payload, "ar");
    const bytes = Ndef.encodeMessage([record]);
    await NfcManager.ndefHandler.writeNdefMessage(bytes);
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => undefined);
  }
}

export async function readNdefPayload(): Promise<{ value: string; kind: NfcPayloadKind } | null> {
  if (!(await isNfcSupported())) throw new Error("NFC_UNSUPPORTED");
  await NfcManager.start();
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const tag = await NfcManager.getTag();
    const firstRecord = tag?.ndefMessage?.[0];
    if (!firstRecord?.payload) return null;
    const bytes = Uint8Array.from(firstRecord.payload as number[]);
    try {
      const uri = Ndef.uri.decodePayload(bytes);
      if (uri) return { value: uri, kind: "uri" };
    } catch {
      // Try text decoding below.
    }
    return { value: Ndef.text.decodePayload(bytes), kind: "text" };
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => undefined);
  }
}
