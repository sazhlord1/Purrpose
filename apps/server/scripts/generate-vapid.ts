/** Prints a fresh VAPID key pair for web push. Put them in the server env. */
import { generateVapidKeys } from '../src/services/webpush.js';

const { publicKey, privateKey } = generateVapidKeys();
console.log(`VAPID_PUBLIC_KEY=${publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${privateKey}`);
console.log('VAPID_SUBJECT=mailto:you@example.com');
