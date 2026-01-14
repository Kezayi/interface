import { useState, useEffect } from 'react';
import { supabaseShim as supabase } from './supabaseShim';
import { RelationshipType } from './relationshipTypes';

let relationshipTypesCache: RelationshipType[] | null = null;
let loadingPromise: Promise<RelationshipType[]> | null = null;

export function useRelationshipTypes() {
  const [relationshipTypes, setRelationshipTypes] = useState<RelationshipType[]>(
    relationshipTypesCache || []
  );
  const [loading, setLoading] = useState(!relationshipTypesCache);

  useEffect(() => {
    if (relationshipTypesCache) {
      return;
    }

    if (!loadingPromise) {
      loadingPromise = loadRelationshipTypes();
    }

    loadingPromise.then((types) => {
      setRelationshipTypes(types);
      setLoading(false);
    });
  }, []);

  const getLabel = (code: string): string => {
    const type = relationshipTypes.find((t) => t.code === code);
    return type?.label_fr || code;
  };

  return { relationshipTypes, loading, getLabel };
}

async function loadRelationshipTypes(): Promise<RelationshipType[]> {
  try {
    const { data, error } = await supabase
      .from('relationship_types')
      .select('*')
      .eq('is_active', true)
      .order('display_order');

    if (error) {
      console.error('Error loading relationship types:', error);
      return [];
    }

    relationshipTypesCache = (data as RelationshipType[]) || [];
    return relationshipTypesCache;
  } catch (error) {
    console.error('Error loading relationship types:', error);
    return [];
  }
}
