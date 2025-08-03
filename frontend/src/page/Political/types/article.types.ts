export type Chapter = {
    title: string;
    content?: string[];
    sections?: Section[];
};

export type Section = {
    title: string;
    content?: string[];
    subSections?: string[];
};

export interface ArticleProps {
    title: string;
    description: string;
    content: string;
}
