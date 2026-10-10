import { Link } from './link.entity';

export abstract class LinkCache {
  abstract get(code: string): Promise<Link | null>;
  abstract set(link: Link): Promise<void>;
  abstract invalidate(code: string): Promise<void>;
}
