/** @jsxImportSource react */
import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';

interface TaskItemProps {
  id: string;
  text: string;
  onDelete: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
}

export function TaskItem({ id, text, onDelete, onTextChange }: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
  });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 9999 : 'auto',
    opacity: isDragging ? 0.85 : 1,
    position: 'relative',
    boxShadow: isDragging ? '0 8px 25px rgba(79, 70, 229, 0.35)' : undefined,
    border: isDragging ? '2px solid #6366f1' : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex items-center bg-white border border-gray-200 rounded-lg shadow-sm px-3 py-2 mb-1.5 cursor-grab active:cursor-grabbing touch-none transition-all hover:shadow-md hover:border-indigo-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...listeners}
      {...attributes}
    >
      {/* テキスト表示・編集エリア */}
      {isEditing ? (
        <input
          type="text"
          value={text}
          onChange={(e) => onTextChange(id, e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setIsEditing(false);
          }}
          autoFocus
          className="flex-1 text-sm bg-transparent border-none outline-none text-gray-800 min-w-0"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span
          className="flex-1 text-sm text-gray-700 truncate select-none"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setIsEditing(true);
          }}
        >
          {text || '（ダブルクリックで編集）'}
        </span>
      )}

      {/* ×削除ボタン（ホバー時のみ表示） */}
      {isHovered && !isDragging && (
        <button
          className="absolute right-1 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-xs font-bold"
          onPointerDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onDelete(id);
          }}
          title="削除"
        >
          ✕
        </button>
      )}
    </div>
  );
}
