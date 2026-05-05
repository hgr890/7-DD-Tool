/** @jsxImportSource react */
import { useState, useCallback, useEffect } from 'react';
import { DndContext, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import { TaskItem } from './TaskItem';

// --- 型定義 ---
interface Task {
  id: string;
  text: string;
  quadrant: string; // 'q1' | 'q2' | 'q3' | 'q4'
}

// --- 領域の設定 ---
const QUADRANTS = [
  { id: 'q1', label: '第1領域：緊急かつ重要', activeBg: 'bg-red-100', activeBorder: 'border-red-400', defaultBg: 'bg-red-50', defaultBorder: 'border-red-200', textColor: 'text-red-700', hoverRing: 'ring-red-400' },
  { id: 'q3', label: '第3領域：緊急だが重要でない', activeBg: 'bg-yellow-100', activeBorder: 'border-yellow-400', defaultBg: 'bg-yellow-50', defaultBorder: 'border-yellow-200', textColor: 'text-yellow-700', hoverRing: 'ring-yellow-400' },
  { id: 'q2', label: '第2領域：緊急でないが重要', activeBg: 'bg-orange-100', activeBorder: 'border-orange-400', defaultBg: 'bg-orange-50', defaultBorder: 'border-orange-200', textColor: 'text-orange-700', hoverRing: 'ring-orange-400' },
  { id: 'q4', label: '第4領域：緊急でなく重要でない', activeBg: 'bg-gray-200', activeBorder: 'border-gray-400', defaultBg: 'bg-gray-100', defaultBorder: 'border-gray-300', textColor: 'text-gray-700', hoverRing: 'ring-gray-400' },
];

// --- ID生成 ---
let idCounter = 0;
const generateId = () => `task-${Date.now()}-${++idCounter}`;

// --- localStorage キー ---
const STORAGE_KEY = '7habits-tasks';

// --- localStorageからタスクを読み込む ---
const loadTasks = (): Task[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as Task[];
    }
  } catch (e) {
    console.warn('タスクの読み込みに失敗しました:', e);
  }
  return []; // デフォルトは空
};

// --- localStorageにタスクを保存する ---
const saveTasks = (tasks: Task[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {
    console.warn('タスクの保存に失敗しました:', e);
  }
};

// --- Droppable領域コンポーネント ---
function QuadrantZone({
  quadrant,
  tasks,
  onDelete,
  onTextChange,
  isPlacingMode,
  onQuadrantClick,
  isDraggingActive,
}: {
  quadrant: typeof QUADRANTS[number];
  tasks: Task[];
  onDelete: (id: string) => void;
  onTextChange: (id: string, text: string) => void;
  isPlacingMode: boolean;
  onQuadrantClick: (quadrantId: string) => void;
  isDraggingActive: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: quadrant.id });

  const hasTasks = tasks.length > 0;
  const bgClass = hasTasks || isOver ? quadrant.activeBg : quadrant.defaultBg;
  const borderClass = isOver ? quadrant.activeBorder : quadrant.defaultBorder;

  return (
    <div
      ref={setNodeRef}
      className={`h-full border-2 p-3 rounded-xl transition-all flex flex-col ${bgClass} ${borderClass} ${isPlacingMode ? `cursor-pointer ring-2 ${quadrant.hoverRing} ring-opacity-60 animate-pulse` : ''
        } ${isOver ? 'ring-2 ring-indigo-400 scale-[1.01]' : ''}`}
      onClick={() => {
        if (isPlacingMode) {
          onQuadrantClick(quadrant.id);
        }
      }}
    >
      <h2 className={`font-bold ${quadrant.textColor} mb-2 text-sm flex-shrink-0`}>
        {quadrant.label}
        <span className="ml-2 text-xs font-normal opacity-60">({tasks.length})</span>
      </h2>

      {isPlacingMode && (
        <div className="text-center text-xs text-indigo-600 font-semibold mb-1 animate-bounce">
          ▼ クリックしてここに追加
        </div>
      )}

      <div className={`flex-1 space-y-0.5 pr-1 custom-scrollbar ${isDraggingActive ? 'overflow-visible' : 'overflow-y-auto'}`}>
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            id={task.id}
            text={task.text}
            onDelete={onDelete}
            onTextChange={onTextChange}
          />
        ))}

        {/* ドラッグオーバー時の「ここにドロップ」表示（タスク末尾） */}
        {isOver && isDraggingActive && (
          <div className="flex items-center justify-center py-3 mt-1 rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-50 animate-fadeIn">
            <span className="text-indigo-600 font-bold text-sm">ここにドロップ</span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- メインApp ---
export const App = () => {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  // タスクが変更されたらlocalStorageに自動保存
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  // ドラッグ中かどうか
  const [isDraggingActive, setIsDraggingActive] = useState(false);

  // 新規作成モード
  const [isCreating, setIsCreating] = useState(false);
  const [newText, setNewText] = useState('');
  const [isPlacingMode, setIsPlacingMode] = useState(false);

  // タスク削除
  const handleDelete = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // テキスト変更
  const handleTextChange = useCallback((id: string, text: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text } : t))
    );
  }, []);

  // ドラッグ開始
  const handleDragStart = (_event: DragStartEvent) => {
    setIsDraggingActive(true);
  };

  // ドラッグ終了 → 領域間移動
  const handleDragEnd = (event: DragEndEvent) => {
    setIsDraggingActive(false);
    const { active, over } = event;
    if (over) {
      const quadrantId = over.id as string;
      setTasks((prev) =>
        prev.map((t) =>
          t.id === active.id ? { ...t, quadrant: quadrantId } : t
        )
      );
    }
  };

  // 新規作成 → 追加ボタン押下
  const handleStartPlacing = () => {
    if (newText.trim().length > 0) {
      setIsPlacingMode(true);
    }
  };

  // 領域クリックでタスク追加
  const handleQuadrantClick = (quadrantId: string) => {
    if (isPlacingMode && newText.trim().length > 0) {
      const newTask: Task = {
        id: generateId(),
        text: newText.trim(),
        quadrant: quadrantId,
      };
      setTasks((prev) => [...prev, newTask]);
      // リセット
      setNewText('');
      setIsPlacingMode(false);
      setIsCreating(false);
    }
  };

  // キャンセル
  const handleCancel = () => {
    setIsCreating(false);
    setIsPlacingMode(false);
    setNewText('');
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-screen w-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex flex-col p-4 overflow-hidden">
        {/* ヘッダー */}
        <div className="flex items-center mb-4 flex-shrink-0">
          {/* 新規作成ボタン & 入力エリア */}
          <div className="flex items-center gap-3">
            {!isCreating && !isPlacingMode && (
              <button
                onClick={() => setIsCreating(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-all text-sm font-bold flex items-center gap-1"
              >
                <span className="text-lg leading-none">＋</span>
                新規作成
              </button>
            )}

            {isCreating && !isPlacingMode && (
              <div className="flex items-center gap-2 bg-white rounded-xl shadow-lg px-4 py-2 border border-indigo-200 animate-fadeIn">
                <input
                  type="text"
                  value={newText}
                  onChange={(e) => setNewText(e.target.value)}
                  placeholder="タスク名を入力..."
                  autoFocus
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent min-w-[200px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newText.trim().length > 0) {
                      handleStartPlacing();
                    }
                    if (e.key === 'Escape') {
                      handleCancel();
                    }
                  }}
                />
                <button
                  onClick={handleStartPlacing}
                  disabled={newText.trim().length === 0}
                  className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${newText.trim().length > 0
                      ? 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg cursor-pointer'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  追加
                </button>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 rounded-lg text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            )}

            {isPlacingMode && (
              <div className="flex items-center gap-3 bg-indigo-100 rounded-xl shadow-lg px-4 py-2 border border-indigo-300 animate-fadeIn">
                <span className="text-sm font-bold text-indigo-700">
                  「{newText}」を追加する領域をクリックしてください
                </span>
                <button
                  onClick={handleCancel}
                  className="px-3 py-1.5 rounded-lg text-sm font-bold text-red-500 hover:bg-red-100 transition-colors"
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>

          {/* タイトル */}
          <h1 className="text-2xl font-black text-indigo-600 ml-auto tracking-tight">
            7 Habits Matrix
          </h1>
        </div>

        {/* マトリクスグリッド */}
        <div className="grid grid-cols-2 grid-rows-2 flex-1 gap-3 min-h-0">
          {QUADRANTS.map((q) => (
            <QuadrantZone
              key={q.id}
              quadrant={q}
              tasks={tasks.filter((t) => t.quadrant === q.id)}
              onDelete={handleDelete}
              onTextChange={handleTextChange}
              isPlacingMode={isPlacingMode}
              onQuadrantClick={handleQuadrantClick}
              isDraggingActive={isDraggingActive}
            />
          ))}
        </div>
      </div>
    </DndContext>
  );
};