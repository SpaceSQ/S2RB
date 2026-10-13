/**
 * S2-CheckSum. Weighted modulo mapping over the payload, excluding the two middle letters.
 * The checksum note counted a 10-character tail and a 24-character identifier.
 * That count is corrected: the identifier is 22 characters, and the tail is an 8-digit serial.
 * Payload is 20 characters (12-character header + 8-digit serial). The note listed 22 primes;
 * the last two are unused because the tail is 8 digits, not 10.
 * The weight table stays in this module. Public pages do not reprint it.
 */

const WEIGHTS = [
  3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41,
  43, 47, 53, 59, 61, 67, 71, 73,
] as const;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Two check letters for a 12-character header and an 8-digit serial. */
export function generateS2CheckSum(part1: string, part2: string): string | null {
  const raw = `${part1}${part2}`.toUpperCase();
  if (raw.length !== 20 || !/^[A-Z0-9]{12}\d{8}$/.test(raw)) return null;

  let sum = 0;
  for (let index = 0; index < 20; index += 1) {
    sum += Number.parseInt(raw[index], 36) * WEIGHTS[index];
  }

  return ALPHABET[sum % 26] + ALPHABET[Math.floor(sum / 26) % 26];
}

export function assembleS2Did(header: string, sequence: string): string | null {
  const checksum = generateS2CheckSum(header, sequence);
  if (checksum === null) return null;
  return `${header}${checksum}${sequence}`.toUpperCase();
}
