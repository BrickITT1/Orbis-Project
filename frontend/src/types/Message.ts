export interface Message {
    id: number,
    content: string,
    user_id: number,
    is_edited: boolean,
    timestamp: string,
  }

export interface MessageGroupp {
    user_id: number;
    minute: string; // или Date, в зависимости от вашей реализации
    messages: Message[]; // массив сообщений для этой группы
  }