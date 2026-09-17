// Unique ID generation: TCH-XXXXXX / STU-XXXXXX / CLS-XXXXXX
// Alphabet without ambiguous chars (0/O, 1/I/L removed)

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomChars(len: number): string {
  let out = "";
  for (let i = 0; i < len; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function generateTeacherCode(): string {
  return `TCH-${randomChars(6)}`;
}

export function generateStudentCode(): string {
  return `STU-${randomChars(6)}`;
}

export function generateClassCode(): string {
  return `CLS-${randomChars(6)}`;
}

export function generateQrToken(): string {
  return randomChars(24);
}
