/**
 * User preference settings persisted in localStorage under the 'userPreferences' key.
 * Add new preference properties here as the application grows.
 */
export interface UserPreferences {
  /** Controls whether the bottom sheet opens in minimized (85vh) or maximized (full height) mode. */
  bottomSheetMode: 'minimized' | 'maximized';
}
