import React from "react";
import { ArticleProps, Chapter, Section } from "../types/article.types";

const Article: React.FC<ArticleProps> = ({ title, description, content }) => {
    const parseContent = (content: string): Chapter[] => {
        const chapters: Chapter[] = [];
        let currentChapter: Chapter | null = null;
        let currentSection: Section | null = null;
        content.split("\n").forEach((line) => {
            if (line.startsWith("## ")) {
                // Новая глава
                currentChapter = {
                    title: line.replace("## ", ""),
                    sections: [],
                };
                chapters.push(currentChapter);
                currentSection = null;
            } else if (line.startsWith("### ")) {
                // Новый пункт
                if (currentChapter) {
                    currentSection = {
                        title: line.replace("### ", ""),
                        subSections: [],
                    };
                    currentChapter?.sections?.push(currentSection);
                }
            } else if (line.startsWith("#### ")) {
                // Новый подпункт
                if (currentSection) {
                    currentSection.subSections =
                        currentSection.subSections || [];
                    currentSection.subSections.push(line.replace("#### ", ""));
                }
            } else if (line.trim() !== "") {
                // Абзац
                if (currentSection) {
                    currentSection.content = currentSection.content || [];
                    currentSection.content.push(line);
                } else if (currentChapter) {
                    currentChapter.content = currentChapter.content || [];
                    currentChapter.content.push(line);
                }
            }
        });

        return chapters;
    };

    const chapters = parseContent(content);
    
    return (
        <div className="text-white p-5">
            <h2 className="p-5 text-2xl">{title}</h2>
            <p className="">{description}</p>
            {chapters.map((chapter, index) => (
                <div key={index} className="chapter">
                    <h2 className="chapter-title">{chapter.title}</h2>
                    {chapter.content &&
                        chapter.content.map((paragraph, idx) => (
                            <p key={idx} className="paragraph">
                                {paragraph}
                            </p>
                        ))}
                    {chapter.sections &&
                        chapter.sections.map((section, idx) => (
                            <div key={idx} className="section">
                                <h3 className="section-title">
                                    {section.title}
                                </h3>
                                {section.content &&
                                    section.content.map((paragraph, idx) => (
                                        <p key={idx} className="paragraph">
                                            {paragraph}
                                        </p>
                                    ))}
                                {section.subSections &&
                                    section.subSections.map(
                                        (subSection, idx) => (
                                            <div
                                                key={idx}
                                                className="sub-section"
                                            >
                                                <h4 className="sub-section-title">
                                                    {subSection}
                                                </h4>
                                            </div>
                                        ),
                                    )}
                            </div>
                        ))}
                </div>
            ))}
        </div>
    );
};

export default Article;
