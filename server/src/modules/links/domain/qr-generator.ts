export abstract class QrGenerator {
  abstract toDataUrl(text: string): Promise<string>;
}
