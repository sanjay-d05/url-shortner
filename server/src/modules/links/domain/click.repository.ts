export interface ClickData {
  linkId: number;
  country: string;
  device: string;
  browser: string;
  os: string;
  referrer: string;
  visitorHash: string;
}

export abstract class ClickRepository {
  abstract record(data: ClickData): Promise<void>;
}
