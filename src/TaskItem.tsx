/** @jsxImportSource react */
import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskItemProps {
  id: string;
  text: string;
  onDelete: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
}

export function TaskItem({ id, text, onDelete, onTextChange }: TaskItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id,
    disabled: isEditing,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 9999 : 'auto',
    opacity: isDragging ? 0.4 : 1,
    position: 'relative',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative flex items-center bg-white border rounded-lg shadow-sm px-3 py-2 mb-1.5 touch-none transition-all hover:shadow-md ${
        isDragging
          ? 'border-indigo-400 shadow-lg scale-[1.02]'
          : 'border-gray-200 hover:border-indigo-300 cursor-grab active:cursor-grabbing'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...attributes}
      {...listeners}
    >
      {/* ドラッグハンドルアイコン */}
      <span className="mr-2 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0 select-none cursor-grab" aria-hidden="true">
        ⠿
      </span>

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

/** ドラッグオーバーレイ用の表示専用コンポーネント */
export function TaskItemOverlay({ text }: { text: string }) {
  return (
    <div className="flex items-center bg-white border-2 border-indigo-400 rounded-lg shadow-2xl px-3 py-2 cursor-grabbing opacity-95 max-w-[300px]">
      <span className="mr-2 text-indigo-400 flex-shrink-0 select-none" aria-hidden="true">
        ⠿
      </span>
      <span className="flex-1 text-sm text-gray-700 truncate select-none font-medium">
        {text}
      </span>
    </div>
  );
}
