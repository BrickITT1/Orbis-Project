
export interface userState {
    loadedProfiles?: UserInfo[];
    openProfile?: UserInfo;
    isOpenProfile?: boolean;
    isSearchActive?: boolean;
    friends?: UserInfo[];
    chats?: any[];
    friendsMode: ModeKeys;
}

export interface fastUserInfo {
    id: number;
    name: string;
    avatar_url: string;
    is_online: boolean;
    
}

export interface UserInfo {
    id: number;
    username: string;
    avatar_url: string;
    about: string;
}

export type ModeKeys = 'Online' | 'Offline' | 'All' | 'Invite' | 'My Invite';
export type ModeState = Record<ModeKeys, boolean>;