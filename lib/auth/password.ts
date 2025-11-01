import { Argon2id } from "oslo/password";

const hasher = new Argon2id({
  memorySize: 19456,
  iterations: 2,
  parallelism: 1,
});

export async function hashPassword(password: string) {
  return hasher.hash(password);
}

export async function verifyPassword(hash: string, candidate: string) {
  return hasher.verify(hash, candidate);
}
