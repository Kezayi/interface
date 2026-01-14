import { Memorial } from './supabase';

interface CacheEntry {
  data: Memorial[];
  timestamp: number;
}

const CACHE_DURATION = 60000;

class MemorialCache {
  private cache: CacheEntry | null = null;

  set(data: Memorial[]) {
    this.cache = {
      data,
      timestamp: Date.now(),
    };
  }

  get(): Memorial[] | null {
    if (!this.cache) return null;

    const now = Date.now();
    if (now - this.cache.timestamp > CACHE_DURATION) {
      this.cache = null;
      return null;
    }

    return this.cache.data;
  }

  clear() {
    this.cache = null;
  }

  isValid(): boolean {
    if (!this.cache) return false;
    const now = Date.now();
    return now - this.cache.timestamp <= CACHE_DURATION;
  }
}

export const memorialCache = new MemorialCache();
