/**
 * Uploaded files are encrypted with the owner's vault key and stored as bytes
 * in the database (works the same locally and on serverless hosts like Vercel).
 */
import { encryptBuffer, decryptBuffer } from './crypto.js';

export const sealFile = (ownerId, buffer) => encryptBuffer(ownerId, buffer);
export const openFile = (ownerId, sealed) => decryptBuffer(ownerId, Buffer.from(sealed));

/**
 * Check the real file type from its first bytes instead of trusting the
 * browser-supplied MIME type. Returns the verified MIME type or null.
 */
export function sniffMime(buffer, claimed) {
  const head = buffer.subarray(0, 8);
  const starts = (...bytes) => bytes.every((b, i) => head[i] === b);
  if (starts(0x25, 0x50, 0x44, 0x46)) return 'application/pdf';
  if (starts(0xff, 0xd8, 0xff)) return 'image/jpeg';
  if (starts(0x89, 0x50, 0x4e, 0x47)) return 'image/png';
  if (starts(0x52, 0x49, 0x46, 0x46) && buffer.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  if (starts(0x50, 0x4b, 0x03, 0x04) && claimed === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return claimed; // .docx is a zip container
  }
  if (claimed === 'text/plain' && !buffer.subarray(0, 4096).includes(0)) return 'text/plain';
  return null;
}
