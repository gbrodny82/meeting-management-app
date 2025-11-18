import CryptoJS from 'crypto-js';
import bcrypt from 'bcryptjs';

// Get encryption key from environment - mandatory for production
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-dev-key-please-change-in-production';

// Critical security check - prevent production use with default key
if (!process.env.ENCRYPTION_KEY) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('CRITICAL SECURITY ERROR: ENCRYPTION_KEY environment variable must be set in production!');
  }
  console.warn('⚠️  WARNING: Using default encryption key. Please set ENCRYPTION_KEY environment variable in production!');
}

// Validate encryption key strength
if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length < 32) {
  throw new Error('SECURITY ERROR: ENCRYPTION_KEY must be at least 32 characters long for adequate security');
}

/**
 * Encrypts sensitive text data using AES encryption
 */
export function encryptText(text: string): string {
  if (!text) return text;
  
  // Don't double-encrypt already encrypted data
  if (text.startsWith('ENC:')) {
    return text;
  }
  
  const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
  return 'ENC:' + encrypted; // Add prefix to identify encrypted data
}

/**
 * Decrypts previously encrypted text data
 */
export function decryptText(encryptedText: string): string {
  if (!encryptedText) return encryptedText;
  
  // Check if data is already encrypted (starts with a specific prefix)
  if (!encryptedText.startsWith('ENC:')) {
    return encryptedText; // Return as-is if not encrypted (backwards compatibility)
  }
  
  try {
    const actualEncryptedText = encryptedText.substring(4); // Remove 'ENC:' prefix
    const bytes = CryptoJS.AES.decrypt(actualEncryptedText, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    
    if (!decrypted) {
      console.warn('Decryption failed - empty result. Key length:', ENCRYPTION_KEY.length);
      console.warn('Encrypted text preview:', encryptedText.substring(0, 20) + '...');
      return encryptedText;
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed for text:', encryptedText.substring(0, 20) + '...');
    console.error('Error:', error);
    console.error('Key status:', ENCRYPTION_KEY ? `Set (${ENCRYPTION_KEY.length} chars)` : 'Not set');
    return encryptedText; // Return original if decryption fails (for backwards compatibility)
  }
}

/**
 * Hashes sensitive data using bcrypt (one-way hashing)
 * Use this for data that doesn't need to be decrypted but can be compared
 */
export function hashData(data: string): string {
  return bcrypt.hashSync(data, 10);
}

/**
 * Compares data with its hash
 */
export function compareHash(data: string, hash: string): boolean {
  return bcrypt.compareSync(data, hash);
}

/**
 * Encrypts an object with sensitive fields
 */
export function encryptSensitiveFields<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const encrypted = { ...obj };
  for (const field of fieldsToEncrypt) {
    if (encrypted[field] && typeof encrypted[field] === 'string') {
      (encrypted as any)[field] = encryptText(encrypted[field] as string);
    }
  }
  return encrypted;
}

/**
 * Decrypts an object with encrypted fields
 */
export function decryptSensitiveFields<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const decrypted = { ...obj };
  for (const field of fieldsToDecrypt) {
    if (decrypted[field] && typeof decrypted[field] === 'string') {
      (decrypted as any)[field] = decryptText(decrypted[field] as string);
    }
  }
  return decrypted;
}

// Define which fields should be encrypted for each entity
export const SENSITIVE_FIELDS = {
  employees: ['name'] as const,
  meetings: ['employeeName', 'title', 'notes'] as const,
  actions: ['text', 'assignee', 'employeeName'] as const,
  users: ['email', 'firstName', 'lastName', 'telegramChatId', 'emailSenderAddress', 'emailSenderPassword'] as const,
} as const;