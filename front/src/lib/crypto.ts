import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

function getEncryptionKey(): Buffer {
  const key = process.env.AUTH_ENCRYPTION_KEY
  if (!key) {
    throw new Error("AUTH_ENCRYPTION_KEY environment variable is not set")
  }
  return createHash("sha256").update(key).digest()
}

export function encrypt(plaintext: string): { encrypted: string; iv: string } {
  const key = getEncryptionKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])

  const authTag = cipher.getAuthTag()

  const combined = Buffer.concat([encrypted, authTag])

  return {
    encrypted: combined.toString("base64"),
    iv: iv.toString("base64"),
  }
}

export function decrypt(encrypted: string, iv: string): string {
  const key = getEncryptionKey()
  const ivBuffer = Buffer.from(iv, "base64")
  const combined = Buffer.from(encrypted, "base64")

  if (combined.length < AUTH_TAG_LENGTH) {
    throw new Error("Invalid encrypted data")
  }

  const ciphertext = combined.subarray(0, -AUTH_TAG_LENGTH)
  const authTag = combined.subarray(-AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, ivBuffer)
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])

  return decrypted.toString("utf8")
}

export function isEncryptionConfigured(): boolean {
  return !!process.env.AUTH_ENCRYPTION_KEY
}
