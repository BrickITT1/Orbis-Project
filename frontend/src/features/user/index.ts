// Реэкспорт всего публичного API модуля auth
export * from './userSlices';
export * from './api/userApi';
export * from './types/user';

// Компоненты
export { default as FriendList } from './components/FriendList/FriendList';
export { default as Search } from './components/Search/Search';
export { default as UserProfile } from './components/UserInfo/UserProfile';

// Хуки
// export { useAuth } from './hooks/useAuth';
// export { useUserSession } from './hooks/useUserSession';

// Утилиты (по необходимости)
// export { validateEmail } from './utils/authHelpers';