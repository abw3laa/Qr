import * as Contacts from "expo-contacts";
import { Platform } from "react-native";
import type { DigitalCard } from "@/shared/card";

export async function saveCardToContacts(card: Pick<DigitalCard, "name" | "phone" | "email" | "company" | "jobTitle">): Promise<"saved" | "unsupported" | "denied"> {
  if (Platform.OS === "web") return "unsupported";
  const permission = await Contacts.requestPermissionsAsync();
  if (permission.status !== Contacts.PermissionStatus.GRANTED) return "denied";
  const nameParts = card.name.trim().split(/\s+/).filter(Boolean);
  const contact: Contacts.Contact = {
    contactType: Contacts.ContactTypes.Person,
    name: card.name,
    [Contacts.Fields.FirstName]: nameParts[0] ?? card.name,
    [Contacts.Fields.LastName]: nameParts.slice(1).join(" "),
    [Contacts.Fields.JobTitle]: card.jobTitle,
    [Contacts.Fields.Company]: card.company,
    [Contacts.Fields.PhoneNumbers]: card.phone ? [{ label: "mobile", number: card.phone }] : [],
    [Contacts.Fields.Emails]: card.email ? [{ label: "work", email: card.email }] : [],
  };
  await Contacts.addContactAsync(contact);
  return "saved";
}
