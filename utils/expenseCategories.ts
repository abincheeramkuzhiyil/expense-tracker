const STORAGE_KEY = 'expenseCategories';

export const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Healthcare',
  'Education',
  'Other',
];

/**
 * Fetches expense categories from localStorage
 * @returns Array of category strings, defaults to DEFAULT_CATEGORIES if none stored
 */
export function getCategories(): string[] {
  if (typeof window === 'undefined') {
    return DEFAULT_CATEGORIES;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing stored categories:', error);
      return DEFAULT_CATEGORIES;
    }
  }
  return DEFAULT_CATEGORIES;
}

/**
 * Saves expense categories to localStorage
 * @param categories - Array of category strings to save
 */
export function saveCategories(categories: string[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error('Error saving categories:', error);
  }
}

/**
 * Adds a new category to the stored categories if it doesn't already exist
 * @param category - Category string to add
 */
export function addNewCategory(category: string): void {
  const categories = getCategories();
  const trimmedCategory = category.trim();

  if (!trimmedCategory) {
    return;
  }

  // Check if category already exists (case-insensitive)
  const exists = categories.some(
    (cat) => cat.toLowerCase() === trimmedCategory.toLowerCase()
  );

  if (!exists) {
    categories.push(trimmedCategory);
    saveCategories(categories);
  }
}
