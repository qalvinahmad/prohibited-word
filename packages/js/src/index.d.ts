export function validate(text, opts) {
  return { isValid: boolean, found: Array<{ word: string, category: string, index: number }> };
}
export function contains(text, opts) {
  return boolean;
}
export function normalize(text) {
  return string;
}
export function censor(text, mask) {
  return string;
}
