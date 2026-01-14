/*
  # Drop Old Function Signatures

  1. **Remove Duplicate Functions**
     - Drop old 4-parameter versions of `get_author_legitimacy_for_memorial` and `toggle_author_legitimacy`
     - These were replaced with simpler 1-parameter versions with secure search_path
     - The old versions don't have secure search_path set

  This fixes the remaining "Function Search Path Mutable" warnings.
*/

-- Drop old 4-parameter version of get_author_legitimacy_for_memorial
DROP FUNCTION IF EXISTS get_author_legitimacy_for_memorial(uuid, uuid, uuid, text);

-- Drop old 4-parameter version of toggle_author_legitimacy
DROP FUNCTION IF EXISTS toggle_author_legitimacy(uuid, uuid, uuid, text);