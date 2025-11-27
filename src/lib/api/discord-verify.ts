/**
 * Discord Webhook Signature Verification
 *
 * Verifies incoming Discord interactions using Ed25519 signatures.
 * Required for Discord slash commands and interactions.
 *
 * Uses Node.js crypto module for Ed25519 verification.
 *
 * @see https://discord.com/developers/docs/interactions/receiving-and-responding#security-and-authorization
 */

import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';

/**
 * Verifies the Ed25519 signature of a Discord interaction request.
 *
 * @param request - The incoming request
 * @param rawBody - The raw request body as a string
 * @returns NextResponse with 401 error if invalid, null if valid
 */
export async function verifyDiscordSignature(
  request: NextRequest,
  rawBody: string
): Promise<NextResponse | null> {
  const signature = request.headers.get('X-Signature-Ed25519');
  const timestamp = request.headers.get('X-Signature-Timestamp');
  const publicKey = process.env.DISCORD_PUBLIC_KEY;

  // Skip verification in development if no public key configured
  if (process.env.NODE_ENV === 'development' && !publicKey) {
    console.warn('[Discord] Skipping signature verification in development');
    return null;
  }

  if (!publicKey) {
    console.error('[Discord] DISCORD_PUBLIC_KEY not configured');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  if (!signature || !timestamp) {
    console.warn('[Discord] Missing signature or timestamp headers');
    return NextResponse.json({ error: 'Invalid request signature' }, { status: 401 });
  }

  try {
    const isValid = verifyEd25519Signature(
      publicKey,
      signature,
      timestamp + rawBody
    );

    if (!isValid) {
      console.warn('[Discord] Invalid signature');
      return NextResponse.json({ error: 'Invalid request signature' }, { status: 401 });
    }

    return null; // Signature is valid
  } catch (error) {
    console.error('[Discord] Signature verification error:', error);
    return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 });
  }
}

/**
 * Verifies an Ed25519 signature using Node.js crypto module.
 */
function verifyEd25519Signature(
  publicKeyHex: string,
  signatureHex: string,
  message: string
): boolean {
  try {
    // Convert hex to buffers
    const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');
    const signatureBuffer = Buffer.from(signatureHex, 'hex');
    const messageBuffer = Buffer.from(message);

    // Create the public key in the format Node.js expects
    // Ed25519 public keys need to be in DER format for Node.js crypto
    const publicKeyDer = Buffer.concat([
      // DER prefix for Ed25519 public key
      Buffer.from('302a300506032b6570032100', 'hex'),
      publicKeyBuffer,
    ]);

    // Create public key object from DER format
    const keyObject = crypto.createPublicKey({
      key: publicKeyDer,
      format: 'der',
      type: 'spki',
    });

    // Verify the Ed25519 signature
    return crypto.verify(null, messageBuffer, keyObject, signatureBuffer);
  } catch (error) {
    console.error('[Discord] Ed25519 verification failed:', error);
    return false;
  }
}
