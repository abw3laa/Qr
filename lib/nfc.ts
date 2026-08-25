import { Platform } from "react-native";

export type NfcPayloadKind = "uri" | "text";

type NfcModule = typeof import("react-native-nfc-manager");

async function getNfcModule(): Promise<NfcModule> {
  return import("react-native-nfc-manager");
}

export async function isNfcSupported(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { default: NfcManager } = await getNfcModule();
    return await NfcManager.isSupported();
  } catch {
    return false;
  }
}

export async function writeNdefPayload(payload: string, kind: NfcPayloadKind): Promise<void> {
  const { default: NfcManager, Ndef, NfcTech } = await getNfcModule();
  if (!(await isNfcSupported())) throw new Error("NFC_UNSUPPORTED");
  await NfcManager.start();
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef);
    const record = kind === "uri" ? Ndef.uriRecord(payload) : Ndef.textRecord(payload, "ar");
    await NfcManager.ndefHandler.writeNdefMessage(Ndef.encodeMessage([record]));
  } finally {
    await NfcManager.cancelTechnologyRequest().catch(() => undefined);
  }
}

export async function readNdefPayload(): Promise<{ value: string; kind: NfcPayloadKind } | null> {
  const { default: NfcManager, Ndef, NfcTech } = await getNfcModule();
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
