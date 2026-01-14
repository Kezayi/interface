const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

type QueryBuilder = {
  select: (columns?: string, options?: any) => QueryBuilder;
  insert: (data: any) => QueryBuilder;
  update: (data: any) => QueryBuilder;
  delete: () => QueryBuilder;
  eq: (column: string, value: any) => QueryBuilder;
  gte: (column: string, value: any) => QueryBuilder;
  lte: (column: string, value: any) => QueryBuilder;
  ilike: (column: string, value: any) => QueryBuilder;
  in: (column: string, values: any[]) => QueryBuilder;
  or: (query: string) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  single: () => Promise<{ data: any; error: any; count?: number }>;
  maybeSingle: () => Promise<{ data: any; error: any; count?: number }>;
  then: (resolve: (value: { data: any; error: any; count?: number }) => void) => Promise<{ data: any; error: any; count?: number }>;
};

class SupabaseQueryBuilder implements QueryBuilder {
  private table: string;
  private selectedColumns: string = '*';
  private filters: Array<{ column: string; operator: string; value: any }> = [];
  private orFilter?: string;
  private orderColumn?: string;
  private orderAsc: boolean = false;
  private limitCount?: number;
  private insertData?: any;
  private updateData?: any;
  private isDelete: boolean = false;
  private returnSingle: boolean = false;
  private returnMaybeSingle: boolean = false;
  private countMode?: 'exact' | 'planned' | 'estimated';
  private headOnly: boolean = false;

  constructor(table: string) {
    this.table = table;
  }

  select(columns: string = '*', options?: any): QueryBuilder {
    this.selectedColumns = columns;
    if (options?.count) {
      this.countMode = options.count;
    }
    if (options?.head) {
      this.headOnly = true;
    }
    return this;
  }

  insert(data: any): QueryBuilder {
    this.insertData = data;
    return this;
  }

  update(data: any): QueryBuilder {
    this.updateData = data;
    return this;
  }

  delete(): QueryBuilder {
    this.isDelete = true;
    return this;
  }

  eq(column: string, value: any): QueryBuilder {
    this.filters.push({ column, operator: 'eq', value });
    return this;
  }

  gte(column: string, value: any): QueryBuilder {
    this.filters.push({ column, operator: 'gte', value });
    return this;
  }

  lte(column: string, value: any): QueryBuilder {
    this.filters.push({ column, operator: 'lte', value });
    return this;
  }

  ilike(column: string, value: any): QueryBuilder {
    this.filters.push({ column, operator: 'ilike', value });
    return this;
  }

  in(column: string, values: any[]): QueryBuilder {
    this.filters.push({ column, operator: 'in', value: values });
    return this;
  }

  or(query: string): QueryBuilder {
    this.orFilter = query;
    return this;
  }

  order(column: string, options?: { ascending?: boolean }): QueryBuilder {
    this.orderColumn = column;
    this.orderAsc = options?.ascending ?? false;
    return this;
  }

  limit(count: number): QueryBuilder {
    this.limitCount = count;
    return this;
  }

  single(): Promise<{ data: any; error: any; count?: number }> {
    this.returnSingle = true;
    return this.execute();
  }

  maybeSingle(): Promise<{ data: any; error: any; count?: number }> {
    this.returnMaybeSingle = true;
    return this.execute();
  }

  then(resolve: (value: { data: any; error: any; count?: number }) => void): Promise<{ data: any; error: any; count?: number }> {
    return this.execute().then(resolve);
  }

  private async execute(): Promise<{ data: any; error: any; count?: number }> {
    try {
      if (this.insertData) {
        return await this.executeInsert();
      } else if (this.updateData) {
        return await this.executeUpdate();
      } else if (this.isDelete) {
        return await this.executeDelete();
      } else {
        return await this.executeSelect();
      }
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : { message: String(error) }
      };
    }
  }

  private async executeSelect(): Promise<{ data: any; error: any; count?: number }> {
    let url = `${supabaseUrl}/rest/v1/${this.table}?`;

    if (this.selectedColumns) {
      url += `select=${this.selectedColumns}&`;
    }

    if (this.orFilter) {
      url += `or=${encodeURIComponent(`(${this.orFilter})`)}&`;
    } else {
      this.filters.forEach(filter => {
        if (filter.operator === 'in' && Array.isArray(filter.value)) {
          const formattedValues = filter.value.map(v => `"${v}"`).join(',');
          url += `${filter.column}=${filter.operator}.(${formattedValues})&`;
        } else {
          url += `${filter.column}=${filter.operator}.${encodeURIComponent(filter.value)}&`;
        }
      });
    }

    if (this.orderColumn) {
      const direction = this.orderAsc ? 'asc' : 'desc';
      url += `order=${this.orderColumn}.${direction}&`;
    }

    if (this.limitCount) {
      url += `limit=${this.limitCount}&`;
    }

    const token = localStorage.getItem('supabase.auth.token') || supabaseAnonKey;

    const headers: Record<string, string> = {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    if (this.returnSingle || this.returnMaybeSingle) {
      headers['Accept'] = 'application/vnd.pgrst.object+json';
    }

    if (this.countMode) {
      headers['Prefer'] = `count=${this.countMode}`;
    }

    const method = this.headOnly ? 'HEAD' : 'GET';
    const response = await fetch(url, { method, headers });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: { message: `HTTP ${response.status}: ${errorText}` }
      };
    }

    let count: number | undefined;
    if (this.countMode) {
      const contentRange = response.headers.get('Content-Range');
      if (contentRange) {
        const match = contentRange.match(/\/(\d+)$/);
        if (match) {
          count = parseInt(match[1], 10);
        }
      }
    }

    if (this.headOnly) {
      return { data: null, error: null, count };
    }

    const data = await response.json();

    if (this.returnSingle || this.returnMaybeSingle) {
      return { data: data || null, error: null, count };
    }

    return { data, error: null, count };
  }

  private async executeInsert(): Promise<{ data: any; error: any; count?: number }> {
    let url = `${supabaseUrl}/rest/v1/${this.table}`;

    if (this.selectedColumns && this.selectedColumns !== '*') {
      url += `?select=${this.selectedColumns}`;
    }

    const token = localStorage.getItem('supabase.auth.token') || supabaseAnonKey;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(this.insertData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: { message: `HTTP ${response.status}: ${errorText}` }
      };
    }

    const result = await response.json();

    if (this.returnSingle) {
      return { data: result[0], error: null };
    }

    return { data: result, error: null };
  }

  private async executeUpdate(): Promise<{ data: any; error: any; count?: number }> {
    let url = `${supabaseUrl}/rest/v1/${this.table}?`;

    this.filters.forEach(filter => {
      url += `${filter.column}=${filter.operator}.${encodeURIComponent(filter.value)}&`;
    });

    const token = localStorage.getItem('supabase.auth.token') || supabaseAnonKey;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(this.updateData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: { message: `HTTP ${response.status}: ${errorText}` }
      };
    }

    const result = await response.json();
    return { data: result[0] || null, error: null };
  }

  private async executeDelete(): Promise<{ data: any; error: any; count?: number }> {
    let url = `${supabaseUrl}/rest/v1/${this.table}?`;

    this.filters.forEach(filter => {
      url += `${filter.column}=${filter.operator}.${encodeURIComponent(filter.value)}&`;
    });

    const token = localStorage.getItem('supabase.auth.token') || supabaseAnonKey;

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: { message: `HTTP ${response.status}: ${errorText}` }
      };
    }

    return { data: null, error: null };
  }
}

class StorageBucket {
  constructor(private bucketName: string) {}

  async upload(path: string, file: File | Blob, options?: any): Promise<{ error: any }> {
    try {
      const token = localStorage.getItem('supabase.auth.token') || supabaseAnonKey;

      const response = await fetch(`${supabaseUrl}/storage/v1/object/${this.bucketName}/${path}`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
        },
        body: file,
      });

      if (!response.ok) {
        const errorText = await response.text();
        return { error: { message: `HTTP ${response.status}: ${errorText}` } };
      }

      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : { message: String(error) } };
    }
  }

  getPublicUrl(path: string): { data: { publicUrl: string } } {
    return {
      data: {
        publicUrl: `${supabaseUrl}/storage/v1/object/public/${this.bucketName}/${path}`
      }
    };
  }
}

class StorageClient {
  from(bucketName: string): StorageBucket {
    return new StorageBucket(bucketName);
  }
}

class RealtimeChannel {
  on(...args: any[]): RealtimeChannel {
    return this;
  }

  subscribe(): RealtimeChannel {
    return this;
  }

  unsubscribe(): void {
  }
}

class AuthClient {
  private authStateListeners: Array<(event: string, session: any) => void> = [];

  async getSession(): Promise<{ data: { session: any }; error: any }> {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        return { data: { session: null }, error: null };
      }

      const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        localStorage.removeItem('supabase.auth.token');
        return { data: { session: null }, error: null };
      }

      const user = await response.json();
      return {
        data: { session: user ? { user, access_token: token } : null },
        error: null,
      };
    } catch (error) {
      localStorage.removeItem('supabase.auth.token');
      return { data: { session: null }, error };
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void): { data: { subscription: { unsubscribe: () => void } } } {
    this.authStateListeners.push(callback);

    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const index = this.authStateListeners.indexOf(callback);
            if (index > -1) {
              this.authStateListeners.splice(index, 1);
            }
          },
        },
      },
    };
  }

  private notifyAuthStateChange(event: string, session: any) {
    this.authStateListeners.forEach(listener => {
      try {
        listener(event, session);
      } catch (error) {
        console.error('Error in auth state listener:', error);
      }
    });
  }

  async signUp(credentials: { email: string; password: string; options?: any }): Promise<{ error: any }> {
    try {
      const body: any = {
        email: credentials.email,
        password: credentials.password,
      };

      if (credentials.options?.data) {
        body.data = credentials.options.data;
      }

      const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { error: errorData };
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  }

  async signInWithPassword(credentials: { email: string; password: string }): Promise<{ data: any; error: any }> {
    try {
      const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData };
      }

      const data = await response.json();
      if (data.access_token) {
        localStorage.setItem('supabase.auth.token', data.access_token);

        const session = {
          user: data.user,
          access_token: data.access_token,
        };

        this.notifyAuthStateChange('SIGNED_IN', session);

        return { data: { user: data.user, session }, error: null };
      }

      return { data: null, error: null };
    } catch (error) {
      return { data: null, error };
    }
  }

  async signOut(): Promise<void> {
    localStorage.removeItem('supabase.auth.token');
    this.notifyAuthStateChange('SIGNED_OUT', null);
  }
}

const authClientInstance = new AuthClient();

export const supabaseShim = {
  from: (table: string) => new SupabaseQueryBuilder(table),
  storage: new StorageClient(),
  channel: (name: string) => new RealtimeChannel(),
  auth: authClientInstance,
  rpc: async (functionName: string, params?: any): Promise<{ data: any; error: any }> => {
    try {
      const token = localStorage.getItem('supabase.auth.token') || supabaseAnonKey;

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${functionName}`, {
        method: 'POST',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params || {}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return { data: null, error: errorData };
      }

      const data = await response.json();
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};
