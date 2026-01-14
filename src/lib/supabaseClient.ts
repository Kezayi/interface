const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export async function supabaseQuery<T = any>(
  table: string,
  options: {
    select?: string;
    eq?: Record<string, any>;
    gte?: Record<string, any>;
    lte?: Record<string, any>;
    gt?: Record<string, any>;
    lt?: Record<string, any>;
    order?: { column: string; ascending?: boolean };
    limit?: number;
    single?: boolean;
    maybeSingle?: boolean;
  } = {}
): Promise<{ data: T[] | null; error: any }> {
  try {
    let url = `${supabaseUrl}/rest/v1/${table}?`;

    if (options.select) {
      url += `select=${options.select}&`;
    }

    if (options.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        url += `${key}=eq.${value}&`;
      });
    }

    if (options.gte) {
      Object.entries(options.gte).forEach(([key, value]) => {
        url += `${key}=gte.${value}&`;
      });
    }

    if (options.lte) {
      Object.entries(options.lte).forEach(([key, value]) => {
        url += `${key}=lte.${value}&`;
      });
    }

    if (options.gt) {
      Object.entries(options.gt).forEach(([key, value]) => {
        url += `${key}=gt.${value}&`;
      });
    }

    if (options.lt) {
      Object.entries(options.lt).forEach(([key, value]) => {
        url += `${key}=lt.${value}&`;
      });
    }

    if (options.order) {
      const direction = options.order.ascending ? 'asc' : 'desc';
      url += `order=${options.order.column}.${direction}&`;
    }

    if (options.limit) {
      url += `limit=${options.limit}&`;
    }

    const headers: Record<string, string> = {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
    };

    if (options.single || options.maybeSingle) {
      headers['Accept'] = 'application/vnd.pgrst.object+json';
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: { message: `HTTP ${response.status}: ${errorText}` }
      };
    }

    const data = await response.json();

    if (options.single || options.maybeSingle) {
      return { data: data ? [data] : null, error: null };
    }

    return { data, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : { message: String(error) }
    };
  }
}

export async function supabaseInsert<T = any>(
  table: string,
  data: any,
  options: { select?: string } = {}
): Promise<{ data: T | null; error: any }> {
  try {
    let url = `${supabaseUrl}/rest/v1/${table}`;
    if (options.select) {
      url += `?select=${options.select}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        data: null,
        error: { message: `HTTP ${response.status}: ${errorText}` }
      };
    }

    const result = await response.json();
    return { data: result[0], error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : { message: String(error) }
    };
  }
}

export async function supabaseUpdate<T = any>(
  table: string,
  data: any,
  options: { eq?: Record<string, any>; select?: string } = {}
): Promise<{ data: T | null; error: any }> {
  try {
    let url = `${supabaseUrl}/rest/v1/${table}?`;

    if (options.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        url += `${key}=eq.${value}&`;
      });
    }

    if (options.select) {
      url += `select=${options.select}&`;
    }

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(data),
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
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : { message: String(error) }
    };
  }
}

export async function supabaseDelete(
  table: string,
  options: { eq?: Record<string, any> } = {}
): Promise<{ error: any }> {
  try {
    let url = `${supabaseUrl}/rest/v1/${table}?`;

    if (options.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        url += `${key}=eq.${value}&`;
      });
    }

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        error: { message: `HTTP ${response.status}: ${errorText}` }
      };
    }

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : { message: String(error) }
    };
  }
}
