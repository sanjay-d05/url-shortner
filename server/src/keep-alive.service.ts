import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Keeps the Render free-tier dyno alive by pinging /api/health every 14 minutes.
 *
 * Enable by setting these env vars on Render:
 *   KEEP_ALIVE_ENABLED=true
 *   BASE_URL=https://your-app.onrender.com   (already required by the app)
 *
 * To disable later, remove KEEP_ALIVE_ENABLED or set it to anything other than "true".
 */
@Injectable()
export class KeepAliveService implements OnApplicationBootstrap {
  private readonly logger = new Logger(KeepAliveService.name);
  private readonly INTERVAL_MS = 14 * 60 * 1000; // 14 minutes

  constructor(private readonly config: ConfigService) {}

  onApplicationBootstrap() {
    const enabled = this.config.get<string>('KEEP_ALIVE_ENABLED') === 'true';
    if (!enabled) return;

    const baseUrl = this.config.get<string>('BASE_URL');
    if (!baseUrl) {
      this.logger.warn('KEEP_ALIVE_ENABLED=true but BASE_URL is not set — skipping keep-alive.');
      return;
    }

    const url = `${baseUrl}/api/health`;
    this.logger.log(`Keep-alive enabled → pinging ${url} every 14 minutes`);

    setInterval(async () => {
      try {
        const res = await fetch(url);
        this.logger.debug(`Keep-alive ping → ${res.status}`);
      } catch (err) {
        this.logger.warn(`Keep-alive ping failed: ${(err as Error).message}`);
      }
    }, this.INTERVAL_MS);
  }
}
