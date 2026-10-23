import { PROOF_MAX_IMAGE_BYTES } from '@purrpose/shared';

export interface ShrunkPhoto {
  type: 'image/jpeg';
  /** Base64 without the data: prefix (what the API takes). */
  data: string;
  previewUrl: string;
}

async function decode(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if ('createImageBitmap' in window) {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall back to <img> (e.g. HEIC on some browsers fails here too) */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
}

function base64Of(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Shrinks a photo in the browser to a JPEG under the API's size limit, so a
 * 12-megapixel phone picture becomes a few hundred kilobytes before it's sent.
 */
export async function shrinkPhoto(file: File): Promise<ShrunkPhoto> {
  const source = await decode(file);
  for (const maxSide of [1280, 960, 720]) {
    const scale = Math.min(1, maxSide / Math.max(source.width, source.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(source.width * scale));
    canvas.height = Math.max(1, Math.round(source.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) break;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    for (const quality of [0.82, 0.7, 0.58]) {
      const blob = await toBlob(canvas, quality);
      if (blob && blob.size <= PROOF_MAX_IMAGE_BYTES) {
        return { type: 'image/jpeg', data: await base64Of(blob), previewUrl: URL.createObjectURL(blob) };
      }
    }
  }
  throw new Error('photo too large');
}
