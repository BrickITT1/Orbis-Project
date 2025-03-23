import React, { useState, useRef } from 'react';
import './test.css';

// Тип для блока
interface Block {
  id: string;
  content: string;
}

export const MovingBlocks: React.FC = () => {
  // Исходный порядок блоков
  const initialBlocks: Block[] = [
    { id: 'block1', content: 'Block 1' },
    { id: 'block2', content: 'Block 2' },
    { id: 'block3', content: 'Block 3' },
    { id: 'block4', content: 'Block 4' },
  ];

  const [blocks, setBlocks] = useState<Block[]>(initialBlocks);
  const [draggingId, setDraggingId] = useState<string | null>(null); // ID перетаскиваемого блока
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 }); // Начальная позиция перетаскивания
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 }); // Смещение блока при перетаскивании
  const containerRef = useRef<HTMLDivElement>(null); // Ссылка на контейнер

  // Обработчик начала перетаскивания
  const handleMouseDown = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    setDraggingId(id);
    dragStartPos.current = { x: e.clientX, y: e.clientY };
    dragOffset.current = { x: 0, y: 0 };
  };

  // Обработчик перемещения мыши
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingId && containerRef.current) {
      // Вычисляем смещение блока
      dragOffset.current = {
        x: e.clientX - dragStartPos.current.x,
        y: e.clientY - dragStartPos.current.y,
      };

      // Находим индекс перетаскиваемого блока
      const draggingIndex = blocks.findIndex((block) => block.id === draggingId);

      // Определяем, над каким блоком находится курсор
      const hoveredBlock = document.elementFromPoint(e.clientX, e.clientY);
      const hoveredId = hoveredBlock?.getAttribute('data-id');

      if (hoveredId && hoveredId !== draggingId) {
        // Находим индекс блока, над которым находится курсор
        const hoveredIndex = blocks.findIndex((block) => block.id === hoveredId);

        // Меняем блоки местами
        const newBlocks = [...blocks];
        const [removed] = newBlocks.splice(draggingIndex, 1);
        newBlocks.splice(hoveredIndex, 0, removed);
        setBlocks(newBlocks);
      }
    }
  };

  // Обработчик завершения перетаскивания
  const handleMouseUp = () => {
    if (draggingId) {
      // Сбрасываем состояние перетаскивания
      setDraggingId(null);
      dragOffset.current = { x: 0, y: 0 };
    }
  };

  return (
    <div
      ref={containerRef}
      className="container"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {blocks.map((block) => (
        <div
          key={block.id}
          data-id={block.id} // Уникальный идентификатор для каждого блока
          className="blockss"
          onMouseDown={(e) => handleMouseDown(block.id, e)}
          style={{
            transform:
              block.id === draggingId
                ? `translate(${dragOffset.current.x}px, ${dragOffset.current.y}px)`
                : undefined,
          }}
        >
          {block.content}
        </div>
      ))}
    </div>
  );
};

export default MovingBlocks;