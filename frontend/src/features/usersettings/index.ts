// Реэкспорт всего публичного API модуля auth
export * from './userSettingsSlice';
export * from './api/userApi';
export * from './types/user';

// Компоненты
export { default as AccountSettings } from './components/Settings/AccountSettings';
export { default as AppearanceSettings } from './components/Settings/AppearanceSettings';
export { default as ChatSettings } from './components/Settings/ChatSettings';
export { default as DevicesSettings } from './components/Settings/DevicesSettings';
export { default as HotKeySettings } from './components/Settings/HotKeySettings';
export { default as LanguageSettings } from './components/Settings/LanguageSettings';
export { default as NotificationSettings } from './components/Settings/NotificationSettings';
export { default as ProfileSettings } from './components/Settings/ProfileSettings';
export { default as VoiceAndVideoSettings } from './components/Settings/VoiceAndVideoSettings';
// Хуки
// export { useAuth } from './hooks/useAuth';
// export { useUserSession } from './hooks/useUserSession';

// Утилиты (по необходимости)
// export { validateEmail } from './utils/authHelpers';