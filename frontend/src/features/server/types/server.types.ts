import { chat } from "@/features/chat";
import { fastUserInfo } from "@/features/user";

export interface voice {
    id: number;
    name: string;
}

export interface server {
    id: number;
    name: string;
    voices: voice[];
    chats: chat[];
    users: fastUserInfo[];
}

export interface serverState {
    servers?: server[];
    activeserver?: server | undefined;
    isActive?: boolean;
    isCreatingServer?: boolean;
    messegerChange?: boolean;
    userChange?: boolean;
}