export interface Content {
    id: string;
    type: string;
    text: string;
    url: string;
}

export interface Message {
    id: number;
    content: Content[];
    user_id: number;
    chat_id?: number;
    username: string;
    is_edited: boolean;
    timestamp: string;
}

export interface MessageGroupp {
    username: string;
    user_id: number;
    minute: string; // или Date, в зависимости от вашей реализации
    messages: Message[]; // массив сообщений для этой группы
}


export interface SingleMessageProps {
  message: Message;
  onClick?: (e: React.MouseEvent) => void;
}
