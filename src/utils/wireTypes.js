import i18n from "../lib/i18n.js";

export const WIRE_TYPE_KEYS = ["Thin", "Thick", "Ultra Thin"];

const TYPE_MESSAGE_KEYS = {
  Thin: "wire_type_thin",
  Thick: "wire_type_thick",
  "Ultra Thin": "wire_type_ultra_thin",
};

export function getWireTypeLabel(type) {
  if (!type) return "";
  const messageKey = TYPE_MESSAGE_KEYS[type];
  if (messageKey) {
    const localized = i18n.getMessage(messageKey);
    if (localized) return localized;
  }
  return type;
}
