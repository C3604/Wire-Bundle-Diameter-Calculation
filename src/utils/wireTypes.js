import i18n from "../lib/i18n.js";

export const WIRE_TYPE_KEYS = ["Thin", "Thick", "Ultra Thin"];

const TYPE_MESSAGE_KEYS = {
  Thin: "wire_type_thin",
  Thick: "wire_type_thick",
  "Ultra Thin": "wire_type_ultra_thin",
};

/**
 * Return the localized label for a wire type value.
 * Falls back to the raw type string when no translation is found.
 * @param {string} type
 * @returns {string}
 */
export function getWireTypeLabel(type) {
  if (!type) return "";
  const messageKey = TYPE_MESSAGE_KEYS[type];
  if (messageKey) {
    const localized = i18n.getMessage(messageKey);
    if (localized) return localized;
  }
  return type;
}

/**
 * Provide localized option metadata for wire type selectors.
 * @param {string[]=} allowedTypes
 * @returns {{ value: string, label: string }[]}
 */
export function getWireTypeOptions(allowedTypes = WIRE_TYPE_KEYS) {
  return allowedTypes
    .filter((type) => TYPE_MESSAGE_KEYS[type])
    .map((type) => ({
      value: type,
      label: getWireTypeLabel(type),
    }));
}
