import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: memorials, error: fetchError } = await supabase
      .from('memorials')
      .select('id, deceased_photo_url, author_id')
      .like('deceased_photo_url', 'data:image%');

    if (fetchError) throw fetchError;

    if (!memorials || memorials.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No memorials with base64 photos found', migrated: 0 }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    let migratedCount = 0;
    const errors = [];

    for (const memorial of memorials) {
      try {
        const base64Data = memorial.deceased_photo_url;
        const matches = base64Data.match(/^data:image\/(\w+);base64,(.*)$/);
        
        if (!matches) {
          errors.push({ id: memorial.id, error: 'Invalid base64 format' });
          continue;
        }

        const [, ext, data] = matches;
        const fileName = `${memorial.author_id}/${memorial.id}.${ext}`;

        const buffer = Uint8Array.from(atob(data), c => c.charCodeAt(0));
        const blob = new Blob([buffer], { type: `image/${ext}` });

        const { error: uploadError } = await supabase.storage
          .from('memorial-photos')
          .upload(fileName, blob, {
            contentType: `image/${ext}`,
            upsert: true,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('memorial-photos')
          .getPublicUrl(fileName);

        const { error: updateError } = await supabase
          .from('memorials')
          .update({ deceased_photo_url: publicUrl })
          .eq('id', memorial.id);

        if (updateError) throw updateError;

        migratedCount++;
      } catch (err) {
        errors.push({ id: memorial.id, error: err.message });
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Migration completed',
        total: memorials.length,
        migrated: migratedCount,
        errors,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});