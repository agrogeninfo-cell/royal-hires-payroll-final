import defaultPhoto from '../assets/images/thusith_profile_1791706204769.jpg';

const STORAGE_KEY = 'royal_hires_md_custom_photo';
const EVENT_KEY = 'royal_hires_photo_updated';

export const getProfilePhoto = (): string => {
  try {
    const custom = localStorage.getItem(STORAGE_KEY);
    if (custom && custom.trim().length > 0) {
      return custom;
    }
  } catch (err) {
    console.warn('Could not read custom profile photo from storage', err);
  }
  return defaultPhoto;
};

export const hasCustomProfilePhoto = (): boolean => {
  try {
    const custom = localStorage.getItem(STORAGE_KEY);
    return Boolean(custom && custom.trim().length > 0);
  } catch {
    return false;
  }
};

export const saveCustomProfilePhoto = (dataUrl: string): void => {
  try {
    localStorage.setItem(STORAGE_KEY, dataUrl);
    window.dispatchEvent(new Event(EVENT_KEY));
  } catch (err) {
    console.error('Failed to save profile photo to localStorage', err);
    throw err;
  }
};

export const clearCustomProfilePhoto = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(EVENT_KEY));
  } catch (err) {
    console.error('Failed to clear profile photo', err);
  }
};

export const subscribeToPhotoUpdates = (callback: (photoUrl: string) => void): (() => void) => {
  const handler = () => {
    callback(getProfilePhoto());
  };
  window.addEventListener(EVENT_KEY, handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener(EVENT_KEY, handler);
    window.removeEventListener('storage', handler);
  };
};
