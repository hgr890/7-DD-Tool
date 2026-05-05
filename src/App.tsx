/** @jsxImportSource react */
import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  pointerWithin,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { TaskItem, TaskItemOverlay } from './TaskItem';

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

const QUADRANT_IDS = QUADRANTS.map((q) => q.id);

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

// --- タスクIDからquadrantを検索するヘルパー ---
const findQuadrant = (tasks: Task[], taskId: UniqueIdentifier): string | undefined => {
  const task = tasks.find((t) => t.id === taskId);
  return task?.quadrant;
};

// --- あるquadrantのタスクをフィルタ・順序付きで取得 ---
const getTasksForQuadrant = (tasks: Task[], quadrantId: string): Task[] => {
  return tasks.filter((t) => t.quadrant === quadrantId);
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

  const taskIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
  const hasTasks = tasks.length > 0;
  const bgClass = hasTasks || isOver ? quadrant.activeBg : quadrant.defaultBg;
  const borderClass = isOver ? quadrant.activeBorder : quadrant.defaultBorder;

  return (
    <div
      ref={setNodeRef}
      className={`h-full border-2 p-3 rounded-xl transition-all flex flex-col ${bgClass} ${borderClass} ${isPlacingMode ? `cursor-pointer ring-2 ${quadrant.hoverRing} ring-opacity-60 animate-pulse` : ''
        } ${isOver && isDraggingActive ? 'ring-2 ring-indigo-400 scale-[1.01]' : ''}`}
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
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              id={task.id}
              text={task.text}
              onDelete={onDelete}
              onTextChange={onTextChange}
            />
          ))}
        </SortableContext>

        {/* ドラッグオーバー時の「ここにドロップ」表示（タスクが無い場合のみ） */}
        {isOver && isDraggingActive && tasks.length === 0 && (
          <div className="flex items-center justify-center py-3 mt-1 rounded-lg border-2 border-dashed border-indigo-400 bg-indigo-50 animate-fadeIn">
            <span className="text-indigo-600 font-bold text-sm">ここにドロップ</span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- カスタム衝突検出: pointerWithinをベースに、closestCornersにフォールバック ---
const customCollisionDetection = (args: Parameters<typeof pointerWithin>[0]) => {
  const pointerCollisions = pointerWithin(args);
  if (pointerCollisions.length > 0) {
    return pointerCollisions;
  }
  return closestCorners(args);
};

// --- メインApp ---
export const App = () => {
  const [tasks, setTasks] = useState<Task[]>(loadTasks);

  // タスクが変更されたらlocalStorageに自動保存
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  // ドラッグ中のアイテムID
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  // 新規作成モード
  const [isCreating, setIsCreating] = useState(false);
  const [newText, setNewText] = useState('');
  const [isPlacingMode, setIsPlacingMode] = useState(false);

  // ドラッグ中かどうか
  const isDraggingActive = activeId !== null;

  // ドラッグ中のアイテムテキスト
  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

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
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };

  // ドラッグオーバー → 別の領域に入った時にリアルタイムで移動
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    // activeのquadrantを探す
    const activeQuadrant = findQuadrant(tasks, activeTaskId);
    if (!activeQuadrant) return;

    // overがquadrant自体の場合
    if (QUADRANT_IDS.includes(overId)) {
      if (activeQuadrant !== overId) {
        setTasks((prev) => {
          const updated = prev.filter((t) => t.id !== activeTaskId);
          const activeItem = prev.find((t) => t.id === activeTaskId);
          if (!activeItem) return prev;
          // 移動先の末尾に追加
          return [...updated, { ...activeItem, quadrant: overId }];
        });
      }
      return;
    }

    // overがタスクの場合
    const overQuadrant = findQuadrant(tasks, overId);
    if (!overQuadrant) return;

    if (activeQuadrant !== overQuadrant) {
      // 異なる領域間の移動
      setTasks((prev) => {
        const updated = prev.filter((t) => t.id !== activeTaskId);
        const activeItem = prev.find((t) => t.id === activeTaskId);
        if (!activeItem) return prev;

        // overアイテムの位置を見つけて、その直前に挿入
        const overIndex = updated.findIndex((t) => t.id === overId);
        const movedItem = { ...activeItem, quadrant: overQuadrant };

        const result = [...updated];
        result.splice(overIndex, 0, movedItem);
        return result;
      });
    }
  };

  // ドラッグ終了 → 同一領域内の並び替え確定
  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskId = active.id as string;
    const overId = over.id as string;

    // overがquadrant自体ならquadrant変更のみ（既にhandleDragOverで処理済み）
    if (QUADRANT_IDS.includes(overId)) {
      return;
    }

    // 同一領域内の並び替え
    const activeQuadrant = findQuadrant(tasks, activeTaskId);
    const overQuadrant = findQuadrant(tasks, overId);

    if (activeQuadrant && overQuadrant && activeQuadrant === overQuadrant) {
      setTasks((prev) => {
        const quadrantTasks = prev.filter((t) => t.quadrant === activeQuadrant);
        const otherTasks = prev.filter((t) => t.quadrant !== activeQuadrant);

        const oldIndex = quadrantTasks.findIndex((t) => t.id === activeTaskId);
        const newIndex = quadrantTasks.findIndex((t) => t.id === overId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reordered = arrayMove(quadrantTasks, oldIndex, newIndex);
          return [...otherTasks, ...reordered];
        }
        return prev;
      });
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

  // 各quadrantのタスクをメモ化
  const quadrantTasksMap = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const q of QUADRANTS) {
      map[q.id] = getTasksForQuadrant(tasks, q.id);
    }
    return map;
  }, [tasks]);

  return (
    <DndContext
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
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
              tasks={quadrantTasksMap[q.id]}
              onDelete={handleDelete}
              onTextChange={handleTextChange}
              isPlacingMode={isPlacingMode}
              onQuadrantClick={handleQuadrantClick}
              isDraggingActive={isDraggingActive}
            />
          ))}
        </div>
      </div>

      {/* ドラッグオーバーレイ */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskItemOverlay text={activeTask.text} /> : null}
      </DragOverlay>
    </DndContext>
  );
};