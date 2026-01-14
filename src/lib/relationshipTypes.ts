export type RelationshipCategory = 'family' | 'in_law' | 'social' | 'professional';
export type RelationshipGender = 'male' | 'female' | 'neutral';

export interface RelationshipType {
  id: number;
  code: string;
  label_fr: string;
  category: RelationshipCategory;
  gender: RelationshipGender;
  reciprocal_code: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RelationshipTypesByCategory {
  family: RelationshipType[];
  in_law: RelationshipType[];
  social: RelationshipType[];
  professional: RelationshipType[];
}

export const CATEGORY_LABELS: Record<RelationshipCategory, string> = {
  family: 'Famille',
  in_law: 'Alliés & Belle-famille (Par mariage/union)',
  social: 'Vie Sociale & Amicale',
  professional: 'Vie Professionnelle & Scolaire',
};

export function groupRelationshipsByCategory(
  relationships: RelationshipType[]
): RelationshipTypesByCategory {
  const grouped: RelationshipTypesByCategory = {
    family: [],
    in_law: [],
    social: [],
    professional: [],
  };

  relationships.forEach((rel) => {
    if (rel.gender !== 'neutral') {
      grouped[rel.category].push(rel);
    }
  });

  Object.keys(grouped).forEach((category) => {
    grouped[category as RelationshipCategory].sort(
      (a, b) => a.display_order - b.display_order
    );
  });

  return grouped;
}

export function getReciprocalRelationship(
  relationships: RelationshipType[],
  relationshipCode: string
): RelationshipType | null {
  const relationship = relationships.find((r) => r.code === relationshipCode);
  if (!relationship || !relationship.reciprocal_code) {
    return null;
  }

  return relationships.find((r) => r.code === relationship.reciprocal_code) || null;
}

export function inferRelationshipToDeceased(
  relationshipCode: string,
  relationships: RelationshipType[]
): string | null {
  const relationship = relationships.find((r) => r.code === relationshipCode);
  return relationship?.reciprocal_code || null;
}

export function getCategoryStats(
  messages: Array<{ relationship: string }>,
  relationships: RelationshipType[]
): Record<RelationshipCategory, { count: number; percentage: number }> {
  const categoryMap = new Map<string, RelationshipCategory>();
  relationships.forEach((rel) => {
    categoryMap.set(rel.code, rel.category);
  });

  const categoryCounts: Record<RelationshipCategory, number> = {
    family: 0,
    in_law: 0,
    social: 0,
    professional: 0,
  };

  messages.forEach((msg) => {
    const category = categoryMap.get(msg.relationship);
    if (category) {
      categoryCounts[category]++;
    }
  });

  const total = messages.length || 1;

  return {
    family: {
      count: categoryCounts.family,
      percentage: Math.round((categoryCounts.family / total) * 100),
    },
    in_law: {
      count: categoryCounts.in_law,
      percentage: Math.round((categoryCounts.in_law / total) * 100),
    },
    social: {
      count: categoryCounts.social,
      percentage: Math.round((categoryCounts.social / total) * 100),
    },
    professional: {
      count: categoryCounts.professional,
      percentage: Math.round((categoryCounts.professional / total) * 100),
    },
  };
}
