export interface UserData {
    info: {
        id: string;
        avatar_url: string;
        email: string;
        displayName: string;
        username: string;
        birthDate: string;
        
    }
    access_token: string;
    username: string;
}

export interface AuthState {
    user: UserData | null;
    isAuthenticated: boolean;
    loading: boolean;
    error: string | null;
}
