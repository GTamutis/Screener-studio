import bcrypt from "bcryptjs";

const ROUNDS = 10;

export async function hashSessionPassword(plain: string) {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifySessionPassword(
  plain: string,
  passwordHash: string,
) {
  return bcrypt.compare(plain, passwordHash);
}
