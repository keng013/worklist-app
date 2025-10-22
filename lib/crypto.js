import crypto from "crypto";

const ALGORITHM = "aes-256-cbc";
const KEY = process.env.CONFIG_ENCRYPTION_KEY; // 👈 กุญแจลับ 32 bytes จาก .env
const IV_LENGTH = 16; // For AES, this is always 16

if (!KEY || KEY.length !== 32) {
  throw new Error(
    "CONFIG_ENCRYPTION_KEY is not defined or not 32 bytes long in .env"
  );
}

/**
 * Encrypts a plain text string
 * @param {string} text - The plain text to encrypt
 * @returns {string} - The encrypted text (iv:encryptedData)
 */
export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  // We prefix the IV to the encrypted data for use in decryption
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/**
 * Decrypts an encrypted string (iv:encryptedData)
 * @param {string} text - The encrypted text
 * @returns {string} - The decrypted plain text
 */
export function decrypt(text) {
  try {
    const parts = text.split(":");
    if (parts.length !== 2) {
      throw new Error("Invalid encrypted text format");
    }
    const iv = Buffer.from(parts.shift(), "hex");
    const encryptedText = Buffer.from(parts.join(":"), "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error("Decryption failed:", error.message);
    throw new Error("Failed to decrypt password. Check CONFIG_ENCRYPTION_KEY.");
  }
}
