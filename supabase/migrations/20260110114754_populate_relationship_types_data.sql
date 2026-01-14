/*
  # Populate Relationship Types Data

  ## Purpose
  Populate the relationship_types table with all 54 relationship options organized by category,
  including reciprocal relationship mappings for kinship inference.

  ## Data Structure
  - Category 1: Famille (Family - blood relations) - 16 types
  - Category 2: Alliés & Belle-famille (In-laws and spouses) - 12 types  
  - Category 3: Vie Sociale & Amicale (Social and friendly) - 13 types
  - Category 4: Vie Professionnelle & Scolaire (Professional and academic) - 13 types

  ## Reciprocal Relationships Logic
  - Parent ↔ Child relationships (father/mother ↔ son/daughter)
  - Sibling relationships (brother ↔ brother/sister, sister ↔ brother/sister)
  - Extended family (uncle/aunt ↔ nephew/niece)
  - Grandparent relationships (grandfather/grandmother ↔ grandson/granddaughter)
  - Spousal relationships (spouse ↔ spouse, partner ↔ partner)
  - In-law relationships (parent-in-law ↔ child-in-law, sibling-in-law ↔ sibling-in-law)
  - Social relationships are mostly reciprocal within same type

  ## Notes
  - Some reciprocal relationships reference a "generic" parent code when gender is ambiguous
  - This enables the system to infer "If A is uncle of deceased, deceased is nephew/niece of A"
  - Display order determines position within each category in the UI
*/

-- Insert Family relationships (Famille - blood relations)
INSERT INTO relationship_types (code, label_fr, category, gender, reciprocal_code, display_order, description) VALUES
  ('father', 'Père', 'family', 'male', 'child', 10, 'Parent masculin direct'),
  ('mother', 'Mère', 'family', 'female', 'child', 20, 'Parent féminin direct'),
  ('son', 'Fils', 'family', 'male', 'parent', 30, 'Enfant masculin direct'),
  ('daughter', 'Fille', 'family', 'female', 'parent', 40, 'Enfant féminin direct'),
  ('brother', 'Frère', 'family', 'male', 'sibling', 50, 'Frère'),
  ('sister', 'Sœur', 'family', 'female', 'sibling', 60, 'Sœur'),
  ('grandfather', 'Grand-père', 'family', 'male', 'grandchild', 70, 'Grand-parent masculin'),
  ('grandmother', 'Grand-mère', 'family', 'female', 'grandchild', 80, 'Grand-parent féminin'),
  ('grandson', 'Petit-fils', 'family', 'male', 'grandparent', 90, 'Petit-enfant masculin'),
  ('granddaughter', 'Petite-fille', 'family', 'female', 'grandparent', 100, 'Petit-enfant féminin'),
  ('uncle', 'Oncle', 'family', 'male', 'nephew_niece', 110, 'Frère du parent'),
  ('aunt', 'Tante', 'family', 'female', 'nephew_niece', 120, 'Sœur du parent'),
  ('nephew', 'Neveu', 'family', 'male', 'uncle_aunt', 130, 'Fils du frère/sœur'),
  ('niece', 'Nièce', 'family', 'female', 'uncle_aunt', 140, 'Fille du frère/sœur'),
  ('cousin_male', 'Cousin', 'family', 'male', 'cousin', 150, 'Cousin'),
  ('cousin_female', 'Cousine', 'family', 'female', 'cousin', 160, 'Cousine'),
  
  -- Generic parent types for reciprocal references
  ('parent', 'Parent', 'family', 'neutral', 'child', 5, 'Parent (genre non spécifié)'),
  ('child', 'Enfant', 'family', 'neutral', 'parent', 25, 'Enfant (genre non spécifié)'),
  ('sibling', 'Frère/Sœur', 'family', 'neutral', 'sibling', 45, 'Frère ou sœur (genre non spécifié)'),
  ('grandparent', 'Grand-parent', 'family', 'neutral', 'grandchild', 65, 'Grand-parent (genre non spécifié)'),
  ('grandchild', 'Petit-enfant', 'family', 'neutral', 'grandparent', 85, 'Petit-enfant (genre non spécifié)'),
  ('uncle_aunt', 'Oncle/Tante', 'family', 'neutral', 'nephew_niece', 105, 'Oncle ou tante (genre non spécifié)'),
  ('nephew_niece', 'Neveu/Nièce', 'family', 'neutral', 'uncle_aunt', 125, 'Neveu ou nièce (genre non spécifié)'),
  ('cousin', 'Cousin(e)', 'family', 'neutral', 'cousin', 145, 'Cousin (genre non spécifié)')
ON CONFLICT (code) DO NOTHING;

-- Insert In-law relationships (Alliés & Belle-famille)
INSERT INTO relationship_types (code, label_fr, category, gender, reciprocal_code, display_order, description) VALUES
  ('spouse_male', 'Époux', 'in_law', 'male', 'spouse_female', 210, 'Mari'),
  ('spouse_female', 'Épouse', 'in_law', 'female', 'spouse_male', 220, 'Femme'),
  ('partner_male', 'Conjoint', 'in_law', 'male', 'partner_female', 230, 'Conjoint masculin'),
  ('partner_female', 'Conjointe', 'in_law', 'female', 'partner_male', 240, 'Conjointe féminine'),
  ('companion_male', 'Compagnon', 'in_law', 'male', 'companion_female', 250, 'Compagnon'),
  ('companion_female', 'Compagne', 'in_law', 'female', 'companion_male', 260, 'Compagne'),
  ('father_in_law', 'Beau-père', 'in_law', 'male', 'child_in_law', 270, 'Père du conjoint'),
  ('mother_in_law', 'Belle-mère', 'in_law', 'female', 'child_in_law', 280, 'Mère du conjoint'),
  ('brother_in_law', 'Beau-frère', 'in_law', 'male', 'sibling_in_law', 290, 'Frère du conjoint ou mari de la sœur'),
  ('sister_in_law', 'Belle-sœur', 'in_law', 'female', 'sibling_in_law', 300, 'Sœur du conjoint ou femme du frère'),
  ('son_in_law', 'Gendre', 'in_law', 'male', 'parent_in_law', 310, 'Mari de la fille'),
  ('daughter_in_law', 'Belle-fille (Bru)', 'in_law', 'female', 'parent_in_law', 320, 'Femme du fils'),
  
  -- Generic in-law types for reciprocal references
  ('parent_in_law', 'Beau-parent', 'in_law', 'neutral', 'child_in_law', 265, 'Beau-parent (genre non spécifié)'),
  ('child_in_law', 'Bel-enfant', 'in_law', 'neutral', 'parent_in_law', 305, 'Gendre ou belle-fille (genre non spécifié)'),
  ('sibling_in_law', 'Beau-frère/Belle-sœur', 'in_law', 'neutral', 'sibling_in_law', 285, 'Frère/sœur par alliance (genre non spécifié)')
ON CONFLICT (code) DO NOTHING;

-- Insert Social relationships (Vie Sociale & Amicale)
INSERT INTO relationship_types (code, label_fr, category, gender, reciprocal_code, display_order, description) VALUES
  ('friend_male', 'Ami', 'social', 'male', 'friend', 410, 'Ami masculin'),
  ('friend_female', 'Amie', 'social', 'female', 'friend', 420, 'Amie féminine'),
  ('childhood_friend_male', 'Ami d''enfance', 'social', 'male', 'childhood_friend', 430, 'Ami d''enfance masculin'),
  ('childhood_friend_female', 'Amie d''enfance', 'social', 'female', 'childhood_friend', 440, 'Amie d''enfance féminine'),
  ('family_friend_male', 'Ami de la famille', 'social', 'male', 'family_friend', 450, 'Ami de la famille masculin'),
  ('family_friend_female', 'Amie de la famille', 'social', 'female', 'family_friend', 460, 'Amie de la famille féminine'),
  ('neighbor_male', 'Voisin', 'social', 'male', 'neighbor', 470, 'Voisin masculin'),
  ('neighbor_female', 'Voisine', 'social', 'female', 'neighbor', 480, 'Voisine féminine'),
  ('godfather', 'Parrain', 'social', 'male', 'godchild', 490, 'Parrain'),
  ('godmother', 'Marraine', 'social', 'female', 'godchild', 500, 'Marraine'),
  ('godson', 'Filleul', 'social', 'male', 'godparent', 510, 'Filleul'),
  ('goddaughter', 'Filleule', 'social', 'female', 'godparent', 520, 'Filleule'),
  ('acquaintance', 'Connaissance', 'social', 'neutral', 'acquaintance', 530, 'Connaissance'),
  
  -- Generic social types for reciprocal references
  ('friend', 'Ami(e)', 'social', 'neutral', 'friend', 405, 'Ami (genre non spécifié)'),
  ('childhood_friend', 'Ami(e) d''enfance', 'social', 'neutral', 'childhood_friend', 425, 'Ami d''enfance (genre non spécifié)'),
  ('family_friend', 'Ami(e) de la famille', 'social', 'neutral', 'family_friend', 445, 'Ami de la famille (genre non spécifié)'),
  ('neighbor', 'Voisin(e)', 'social', 'neutral', 'neighbor', 465, 'Voisin (genre non spécifié)'),
  ('godparent', 'Parrain/Marraine', 'social', 'neutral', 'godchild', 485, 'Parrain ou marraine'),
  ('godchild', 'Filleul(e)', 'social', 'neutral', 'godparent', 505, 'Filleul ou filleule')
ON CONFLICT (code) DO NOTHING;

-- Insert Professional relationships (Vie Professionnelle & Scolaire)
INSERT INTO relationship_types (code, label_fr, category, gender, reciprocal_code, display_order, description) VALUES
  ('colleague', 'Collègue', 'professional', 'neutral', 'colleague', 610, 'Collègue de travail'),
  ('former_colleague_male', 'Ancien collègue', 'professional', 'male', 'former_colleague', 620, 'Ancien collègue masculin'),
  ('former_colleague_female', 'Ancienne collègue', 'professional', 'female', 'former_colleague', 630, 'Ancienne collègue féminine'),
  ('collaborator_male', 'Collaborateur', 'professional', 'male', 'collaborator', 640, 'Collaborateur masculin'),
  ('collaborator_female', 'Collaboratrice', 'professional', 'female', 'collaborator', 650, 'Collaboratrice féminine'),
  ('partner_pro', 'Partenaire', 'professional', 'neutral', 'partner_pro', 660, 'Partenaire professionnel'),
  ('employer', 'Employeur', 'professional', 'neutral', 'employee', 670, 'Employeur'),
  ('manager', 'Responsable', 'professional', 'neutral', 'employee', 680, 'Responsable hiérarchique'),
  ('employee_male', 'Employé', 'professional', 'male', 'employer', 690, 'Employé masculin'),
  ('employee_female', 'Employée', 'professional', 'female', 'employer', 700, 'Employée féminine'),
  ('classmate_promotion', 'Camarade de promotion', 'professional', 'neutral', 'classmate_promotion', 710, 'Camarade de promotion académique'),
  ('classmate', 'Camarade de classe', 'professional', 'neutral', 'classmate', 720, 'Camarade de classe'),
  ('association_member', 'Membre d''association', 'professional', 'neutral', 'association_member', 730, 'Membre de la même association'),
  
  -- Generic professional types for reciprocal references
  ('former_colleague', 'Ancien(ne) collègue', 'professional', 'neutral', 'former_colleague', 615, 'Ancien collègue (genre non spécifié)'),
  ('collaborator', 'Collaborateur/trice', 'professional', 'neutral', 'collaborator', 635, 'Collaborateur (genre non spécifié)'),
  ('employee', 'Employé(e)', 'professional', 'neutral', 'employer', 685, 'Employé (genre non spécifié)')
ON CONFLICT (code) DO NOTHING;
