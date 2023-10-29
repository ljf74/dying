export const clamp = (x, min, max) => Math.min(max, Math.max(x, min));
export const negMod = (m, n) => ((m % n) + n) % n;
