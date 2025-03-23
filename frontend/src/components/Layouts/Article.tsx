import React from 'react';
import '../../styles/layout/Article.scss'; // Импорт CSS-файла

// Типы для структуры статьи
type Chapter = {
  title: string;
  content?: string[];
  sections?: Section[];
};

type Section = {
  title: string;
  content?: string[];
  subSections?: string[];
};

// Пропсы для компонента Article
interface ArticleProps {
  title: string;
  description: string;
  content: string;
}

// Компонент Article
const Article: React.FC<ArticleProps> = ({ title, description, content }) => {
  // Функция для разбора контента на главы, пункты и подпункты
  const parseContent = (content: string): Chapter[] => {
    const chapters: Chapter[] = [];
    let currentChapter: Chapter | null = null;
    let currentSection: Section | null = null;
    
    content.split('\n').forEach((line) => {
      if (line.startsWith('## ')) {
        // Новая глава
        currentChapter = { title: line.replace('## ', ''), sections: [] };
        chapters.push(currentChapter);
        currentSection = null;
      } else if (line.startsWith('### ')) {
        // Новый пункт
        if (currentChapter) {
          currentSection = { title: line.replace('### ', ''), subSections: [] };
          currentChapter?.sections?.push(currentSection);
        }
      } else if (line.startsWith('#### ')) {
        // Новый подпункт
        if (currentSection) {
          currentSection.subSections = currentSection.subSections || [];
          currentSection.subSections.push(line.replace('#### ', ''));
        }
      } else if (line.trim() !== '') {
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
    <div className="article-container">
      <h1 className="article-title">{title}</h1>
      <p className="article-description">{description}</p>
      {chapters.map((chapter, index) => (
        <div key={index} className="chapter">
          <h2 className="chapter-title">{chapter.title}</h2>
          {chapter.content &&
            chapter.content.map((paragraph, idx) => (
              <p key={idx} className="paragraph">{paragraph}</p>
            ))}
          {chapter.sections &&
            chapter.sections.map((section, idx) => (
              <div key={idx} className="section">
                <h3 className="section-title">{section.title}</h3>
                {section.content &&
                  section.content.map((paragraph, idx) => (
                    <p key={idx} className="paragraph">{paragraph}</p>
                  ))}
                {section.subSections &&
                  section.subSections.map((subSection, idx) => (
                    <div key={idx} className="sub-section">
                      <h4 className="sub-section-title">{subSection}</h4>
                    </div>
                  ))}
              </div>
            ))}
        </div>
      ))}
    </div>
  );
};

export default Article;