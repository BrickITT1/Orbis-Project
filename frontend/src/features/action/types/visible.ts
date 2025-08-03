export type Visible = 'ERROR' | 'WARNING' | 'SUCCESS'

export type typeAction = 'ERROR' | 'WARNING' | 'SUCCESS';

export interface action {
    id: number;
    type: typeAction;
    text: string;
    duration: number;
}

export interface actionSlicis {
    Action: action[];
    isPersonalCommunicateActive: boolean
}
