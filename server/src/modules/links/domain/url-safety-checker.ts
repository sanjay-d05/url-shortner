export abstract class UrlSafetyChecker {
  abstract isSafe(url: string): Promise<boolean>;
}
