import Fuse from 'fuse.js';
import { supabaseShim as supabase } from './supabaseShim';
import { Relationship, GuestbookMessage, Memorial } from './supabase';

export type RelationshipCategory = 'family' | 'professional' | 'friend' | 'other';

export type Author = {
  name: string;
  email: string;
  phone: string;
  relationship: Relationship;
  relationshipCategory: RelationshipCategory;
  memorial_id: string;
  message_text: string;
  created_at: string;
};

export type SimilarityMatch = {
  author: Author;
  similarityScore: number;
  matchType: 'name' | 'surname' | 'fullname';
};

export type ConnectionObject = {
  directRelation?: {
    deceased: Memorial;
    relationship: Relationship;
    relationshipCategory: RelationshipCategory;
  };
  indirectPeers: Author[];
  similaritySuggestions: SimilarityMatch[];
  allAuthors: Author[];
};

export type SearchResult = {
  type: 'deceased' | 'author';
  deceased?: Memorial;
  author?: Author;
  connectionData: ConnectionObject;
};

const RELATIONSHIP_CATEGORIES: Record<Relationship, RelationshipCategory> = {
  parent: 'family',
  child: 'family',
  spouse: 'family',
  sibling: 'family',
  grandparent: 'family',
  grandchild: 'family',
  uncle_aunt: 'family',
  cousin: 'family',
  colleague: 'professional',
  friend: 'friend',
  neighbor: 'other',
  acquaintance: 'other',
  other: 'other',
};

export function categorizeRelationship(relationship: Relationship): RelationshipCategory {
  return RELATIONSHIP_CATEGORIES[relationship] || 'other';
}

export function getRelationshipLabel(relationship: Relationship): string {
  const labels: Record<Relationship, string> = {
    parent: 'Parent',
    child: 'Enfant',
    spouse: 'Conjoint(e)',
    sibling: 'Frère/Sœur',
    grandparent: 'Grand-parent',
    grandchild: 'Petit-enfant',
    uncle_aunt: 'Oncle/Tante',
    cousin: 'Cousin(e)',
    colleague: 'Collègue',
    friend: 'Ami(e)',
    neighbor: 'Voisin(e)',
    acquaintance: 'Connaissance',
    other: 'Autre',
  };
  return labels[relationship] || 'Autre';
}

export function getCategoryLabel(category: RelationshipCategory): string {
  const labels: Record<RelationshipCategory, string> = {
    family: 'Famille',
    professional: 'Professionnel',
    friend: 'Ami',
    other: 'Autre',
  };
  return labels[category];
}

export function getCategoryColor(category: RelationshipCategory): string {
  const colors: Record<RelationshipCategory, string> = {
    family: '#3b82f6',
    professional: '#10b981',
    friend: '#f59e0b',
    other: '#6b7280',
  };
  return colors[category];
}

async function fetchAuthorsForMemorial(memorialId: string): Promise<Author[]> {
  const { data, error } = await supabase
    .from('guestbook_messages')
    .select('author_name, author_email, author_phone, relationship, message_text, created_at, memorial_id')
    .eq('memorial_id', memorialId);

  if (error) throw error;

  return (data || []).map((msg) => ({
    name: msg.author_name,
    email: msg.author_email,
    phone: msg.author_phone,
    relationship: msg.relationship as Relationship,
    relationshipCategory: categorizeRelationship(msg.relationship as Relationship),
    memorial_id: msg.memorial_id,
    message_text: msg.message_text,
    created_at: msg.created_at,
  }));
}

function findSimilarAuthors(targetAuthor: Author, allAuthors: Author[]): SimilarityMatch[] {
  const targetParts = targetAuthor.name.toLowerCase().split(' ');
  const targetFirstName = targetParts[0] || '';
  const targetLastName = targetParts[targetParts.length - 1] || '';

  const matches: SimilarityMatch[] = [];

  allAuthors.forEach((author) => {
    if (author.email === targetAuthor.email) return;

    const authorParts = author.name.toLowerCase().split(' ');
    const authorFirstName = authorParts[0] || '';
    const authorLastName = authorParts[authorParts.length - 1] || '';

    if (authorLastName && targetLastName && authorLastName === targetLastName) {
      matches.push({
        author,
        similarityScore: 0.9,
        matchType: 'surname',
      });
    } else if (authorFirstName && targetFirstName && authorFirstName === targetFirstName) {
      matches.push({
        author,
        similarityScore: 0.5,
        matchType: 'name',
      });
    }
  });

  const fuse = new Fuse(
    allAuthors.filter((a) => a.email !== targetAuthor.email && !matches.find((m) => m.author.email === a.email)),
    {
      keys: ['name'],
      threshold: 0.3,
      includeScore: true,
    }
  );

  const fuzzyMatches = fuse.search(targetAuthor.name);
  fuzzyMatches.forEach((result) => {
    if (result.score && result.score < 0.3) {
      matches.push({
        author: result.item,
        similarityScore: 1 - result.score,
        matchType: 'fullname',
      });
    }
  });

  return matches.sort((a, b) => b.similarityScore - a.similarityScore);
}

export async function searchDeceasedAndAuthors(query: string): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  const { data: memorials, error: memorialsError } = await supabase
    .from('memorials')
    .select('*')
    .eq('is_published', true)
    .ilike('deceased_full_name', `%${query}%`)
    .limit(10);

  if (memorialsError) throw memorialsError;

  for (const memorial of memorials || []) {
    const authors = await fetchAuthorsForMemorial(memorial.id);

    const authorsByCategory = authors.reduce((acc, author) => {
      if (!acc[author.relationshipCategory]) {
        acc[author.relationshipCategory] = [];
      }
      acc[author.relationshipCategory].push(author);
      return acc;
    }, {} as Record<RelationshipCategory, Author[]>);

    results.push({
      type: 'deceased',
      deceased: memorial,
      connectionData: {
        indirectPeers: authors,
        similaritySuggestions: [],
        allAuthors: authors,
      },
    });
  }

  const { data: messages, error: messagesError } = await supabase
    .from('guestbook_messages')
    .select('*, memorials!inner(*)')
    .ilike('author_name', `%${query}%`);

  if (messagesError) throw messagesError;

  const authorResults = new Map<string, SearchResult>();

  for (const message of messages || []) {
    const memorial = (message as any).memorials;
    if (!memorial || !memorial.is_published) continue;

    const author: Author = {
      name: message.author_name,
      email: message.author_email,
      phone: message.author_phone,
      relationship: message.relationship as Relationship,
      relationshipCategory: categorizeRelationship(message.relationship as Relationship),
      memorial_id: message.memorial_id,
      message_text: message.message_text,
      created_at: message.created_at,
    };

    const key = `${message.memorial_id}-${message.author_email}`;

    if (!authorResults.has(key)) {
      const allAuthors = await fetchAuthorsForMemorial(message.memorial_id);
      const indirectPeers = allAuthors.filter((a) => a.email !== author.email);
      const similaritySuggestions = findSimilarAuthors(author, allAuthors);

      authorResults.set(key, {
        type: 'author',
        author,
        connectionData: {
          directRelation: {
            deceased: memorial,
            relationship: author.relationship,
            relationshipCategory: author.relationshipCategory,
          },
          indirectPeers,
          similaritySuggestions,
          allAuthors,
        },
      });
    }
  }

  return [...results, ...Array.from(authorResults.values())];
}

export function groupAuthorsByCategory(authors: Author[]): Record<RelationshipCategory, Author[]> {
  return authors.reduce((acc, author) => {
    if (!acc[author.relationshipCategory]) {
      acc[author.relationshipCategory] = [];
    }
    acc[author.relationshipCategory].push(author);
    return acc;
  }, {} as Record<RelationshipCategory, Author[]>);
}
