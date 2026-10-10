import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { QrGenerator } from '../domain/qr-generator';

@Injectable()
export class QrCodeGenerator implements QrGenerator {
  toDataUrl(text: string): Promise<string> {
    return QRCode.toDataURL(text, { margin: 1, width: 320 });
  }
}
