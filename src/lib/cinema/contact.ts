export function normalizePhoneNumber(value: string) {
  return value.replace(/\D/g, "").slice(0, 11);
}

export function isValidPhoneNumber(value: string) {
  return /^010\d{8}$/.test(value);
}

export function isValidOptionalPhoneNumber(value?: string) {
  return !value || isValidPhoneNumber(value);
}
