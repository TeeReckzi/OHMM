import type { CanonicalAttachment, AttachmentSlot } from "../itemTypes";
import { attachments as generatedAttachments } from "./generated/attachments.generated";
import { parseAttachmentEffectSummary } from "../../utils/parseAttachmentEffect";

function populateAttachmentModifiers(): CanonicalAttachment[] {
 return generatedAttachments.map((a) => {
  if (a.statModifiers && a.statModifiers.length > 0) return a;
  const parsed = parseAttachmentEffectSummary(a.effectSummary ?? "");
  if (parsed.length === 0) return a;
  return { ...a, statModifiers: parsed };
 });
}

export const attachmentRegistry: CanonicalAttachment[] = populateAttachmentModifiers();

export function getAttachment(id: string): CanonicalAttachment | undefined {
 return attachmentRegistry.find((a) => a.id === id);
}

export function getAttachmentsBySlot(slot: AttachmentSlot): CanonicalAttachment[] {
 return attachmentRegistry.filter((a) => a.attachmentSlot === slot);
}

export function listAttachmentSlots(): AttachmentSlot[] {
 return [...new Set(attachmentRegistry.map((a) => a.attachmentSlot))];
}

const ALL_FIREARM_FAMILIES = ["Assault Rifle", "LMG", "SMG", "Sniper Rifle", "Shotgun", "Pistol"];

export function getAttachmentFamilies(a: CanonicalAttachment): string[] {
 const name = a.name.toLowerCase();

 switch (a.attachmentSlot) {
  case "magazine":
  case "stock":
   if (name.includes("pistol")) return ["Pistol"];
   if (name.includes("smg")) return ["SMG"];
   if (name.includes("shotgun")) return ["Shotgun"];
   if (name.includes("sr") && !name.includes("tactical")) return ["Sniper Rifle"];
   if (name.includes("sniper")) return ["Sniper Rifle"];
   if (name.includes("lmg")) return ["LMG"];
   if (name.includes("rifle")) return ["Assault Rifle", "LMG", "Sniper Rifle"];
   if (name.includes("small-caliber")) return ["Pistol"];
   if (name.includes("medium-caliber")) return ["SMG", "Assault Rifle", "LMG"];
   return ALL_FIREARM_FAMILIES;
  case "muzzle":
   if (name.includes("shotgun")) return ["Shotgun"];
   if (name.includes("small-caliber")) return ["Pistol"];
   if (name.includes("medium-caliber")) return ["SMG", "Assault Rifle", "LMG"];
   return ALL_FIREARM_FAMILIES;
  case "optic":
   if (name.includes("sniper") || (name.includes("rifle") && name.includes("scope"))) {
    return ["Sniper Rifle", "Assault Rifle"];
   }
   return ALL_FIREARM_FAMILIES;
  case "tactical":
   return ALL_FIREARM_FAMILIES;
 }
}

export function getAttachmentsBySlotAndFamily(slot: AttachmentSlot, weaponFamily: string): CanonicalAttachment[] {
 return attachmentRegistry.filter((a) => {
  if (a.attachmentSlot !== slot) return false;
  const families = getAttachmentFamilies(a);
  return families.includes(weaponFamily);
 });
}
