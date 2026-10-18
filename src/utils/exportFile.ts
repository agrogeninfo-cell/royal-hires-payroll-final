import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface ExportFileOptions {
  fileName: string;
  data: string;
  mimeType: string;
  base64?: boolean;
  title?: string;
  dialogTitle?: string;
}

/**
 * Export files reliably on Android Capacitor and in desktop/mobile browsers.
 * Native WebViews often ignore anchor download attributes and Blob URLs, so
 * native exports are written to the app cache and passed to Android's share sheet.
 */
export async function exportFile(options: ExportFileOptions): Promise<void> {
  const safeName = options.fileName.replace(/[\\/:*?"<>|]/g, '_');
  if (Capacitor.isNativePlatform()) {
    const saved = await Filesystem.writeFile({
      path: safeName,
      data: options.data,
      directory: Directory.Cache,
      recursive: true,
    });
    await Share.share({
      title: options.title || safeName,
      text: safeName,
      url: saved.uri,
      dialogTitle: options.dialogTitle || 'Save or share file',
    });
    return;
  }

  let contents: BlobPart;
  if (options.base64) {
    const binary = window.atob(options.data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    contents = bytes;
  } else {
    contents = options.data;
  }

  const blob = new Blob([contents], { type: options.mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = safeName;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}
