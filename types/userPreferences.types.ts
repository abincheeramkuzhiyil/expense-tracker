/**
 * User preference settings persisted in localStorage under the 'userPreferences' key.
 * Add new preference properties here as the application grows.
 */
export interface UserPreferences {
  /** Controls whether content dialogs open as a bottom sheet or fullscreen. */
  dialogDisplayMode: 'sheet' | 'fullscreen';
}
