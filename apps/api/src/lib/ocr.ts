import { ScannedLineItem } from '@finsnap/shared';

export async function analyzeWithOCR(_base64Image: string): Promise<ScannedLineItem[]> {
  throw new Error(
    'OCR now runs on-device. Please update your app to the latest version.'
  );
}

