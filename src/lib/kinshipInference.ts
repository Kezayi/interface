export type StrictRelationType =
  | 'spouse'
  | 'child'
  | 'parent'
  | 'sibling'
  | 'grandparent'
  | 'grandchild'
  | 'uncle_aunt'
  | 'nephew_niece'
  | 'cousin'
  | 'in_law'
  | 'friend'
  | 'colleague'
  | 'neighbor'
  | 'other';

export interface Author {
  id: string;
  firstName: string;
  lastName: string;
  relationType: StrictRelationType;
  deceasedId: string;
  message?: string;
  timestamp?: string;
}

export interface DeducedRelationship {
  authorA: Author;
  authorB: Author;
  deducedRelation: string;
  labelFr: string;
  explanation: string;
  confidence: number;
}

export function getRelationLabel(relation: StrictRelationType): string {
  const labels: Record<StrictRelationType, string> = {
    spouse: 'Conjoint(e)',
    child: 'Enfant',
    parent: 'Parent',
    sibling: 'Frère/Sœur',
    grandparent: 'Grand-parent',
    grandchild: 'Petit-enfant',
    uncle_aunt: 'Oncle/Tante',
    nephew_niece: 'Neveu/Nièce',
    cousin: 'Cousin(e)',
    in_law: 'Belle-famille',
    friend: 'Ami(e)',
    colleague: 'Collègue',
    neighbor: 'Voisin(e)',
    other: 'Autre',
  };
  return labels[relation] || 'Relation inconnue';
}

export function mapLegacyRelationToStrict(legacyRelation?: string | null): StrictRelationType | null {
  if (!legacyRelation) return null;

  const mapping: Record<string, StrictRelationType> = {
    spouse: 'spouse',
    child: 'child',
    parent: 'parent',
    sibling: 'sibling',
    grandparent: 'grandparent',
    grandchild: 'grandchild',
    uncle_aunt: 'uncle_aunt',
    nephew_niece: 'nephew_niece',
    cousin: 'cousin',
    in_law: 'in_law',
    friend: 'friend',
    colleague: 'colleague',
    neighbor: 'neighbor',
    other: 'other',
  };

  return mapping[legacyRelation.toLowerCase()] || null;
}

export function buildKinshipMesh(
  authors: Author[],
  deceased: { firstName: string; lastName: string }
): DeducedRelationship[] {
  const relationships: DeducedRelationship[] = [];

  for (let i = 0; i < authors.length; i++) {
    for (let j = i + 1; j < authors.length; j++) {
      const authorA = authors[i];
      const authorB = authors[j];

      const deduced = deduceRelationship(authorA, authorB, deceased);
      if (deduced) {
        relationships.push(deduced);
      }
    }
  }

  return relationships;
}

function deduceRelationship(
  authorA: Author,
  authorB: Author,
  deceased: { firstName: string; lastName: string }
): DeducedRelationship | null {
  const relA = authorA.relationType;
  const relB = authorB.relationType;

  if (relA === 'child' && relB === 'child') {
    return {
      authorA,
      authorB,
      deducedRelation: 'sibling',
      labelFr: 'Frère/Sœur',
      explanation: `${authorA.firstName} et ${authorB.firstName} sont tous deux enfants de ${deceased.firstName}, donc probablement frères/sœurs`,
      confidence: 0.95,
    };
  }

  if (relA === 'spouse' && relB === 'child') {
    return {
      authorA,
      authorB,
      deducedRelation: 'parent_child',
      labelFr: 'Parent/Enfant',
      explanation: `${authorA.firstName} est le conjoint de ${deceased.firstName} et ${authorB.firstName} est l'enfant de ${deceased.firstName}, donc probablement parent/enfant`,
      confidence: 0.9,
    };
  }

  if (relA === 'child' && relB === 'spouse') {
    return {
      authorA,
      authorB,
      deducedRelation: 'parent_child',
      labelFr: 'Parent/Enfant',
      explanation: `${authorB.firstName} est le conjoint de ${deceased.firstName} et ${authorA.firstName} est l'enfant de ${deceased.firstName}, donc probablement parent/enfant`,
      confidence: 0.9,
    };
  }

  if (relA === 'parent' && relB === 'parent') {
    return {
      authorA,
      authorB,
      deducedRelation: 'spouse',
      labelFr: 'Conjoint(e)',
      explanation: `${authorA.firstName} et ${authorB.firstName} sont tous deux parents de ${deceased.firstName}, donc probablement conjoints`,
      confidence: 0.85,
    };
  }

  if (relA === 'sibling' && relB === 'sibling') {
    return {
      authorA,
      authorB,
      deducedRelation: 'in_law_or_sibling',
      labelFr: 'Beaux-frères/Belles-sœurs ou Frères/Sœurs',
      explanation: `${authorA.firstName} et ${authorB.firstName} sont tous deux frères/sœurs de ${deceased.firstName}`,
      confidence: 0.8,
    };
  }

  if (
    (relA === 'grandchild' && relB === 'grandchild') ||
    (relA === 'grandparent' && relB === 'grandparent')
  ) {
    return {
      authorA,
      authorB,
      deducedRelation: 'family',
      labelFr: 'Famille',
      explanation: `${authorA.firstName} et ${authorB.firstName} partagent une relation familiale à travers ${deceased.firstName}`,
      confidence: 0.7,
    };
  }

  if (authorA.lastName === authorB.lastName && authorA.lastName !== '') {
    return {
      authorA,
      authorB,
      deducedRelation: 'potential_family',
      labelFr: 'Famille Potentielle',
      explanation: `${authorA.firstName} et ${authorB.firstName} partagent le même nom de famille (${authorA.lastName})`,
      confidence: 0.6,
    };
  }

  return null;
}

export function findPotentialRelativesBySurname(authors: Author[]): Map<string, Author[]> {
  const surnameGroups = new Map<string, Author[]>();

  for (const author of authors) {
    const lastName = author.lastName.trim().toUpperCase();
    if (lastName === '') continue;

    if (!surnameGroups.has(lastName)) {
      surnameGroups.set(lastName, []);
    }
    surnameGroups.get(lastName)!.push(author);
  }

  const result = new Map<string, Author[]>();
  for (const [surname, group] of surnameGroups.entries()) {
    if (group.length > 1) {
      result.set(surname, group);
    }
  }

  return result;
}
