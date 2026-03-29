/** @jsxImportSource react */
import { useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { Draggable } from './Draggable';
import { Droppable } from './Droppable';

export const App = () => {
  // タスクが現在どの領域(ID)に存在するかを管理
  // 初期値は 'q1'（第1領域）
  const [parent, setParent] = useState<string | null>('q1');

  // ドラッグが終わった時の処理
  const handleDragEnd = (event: DragEndEvent) => {
    const { over } = event;
    // もしDroppable領域の上で離されたら、その領域のIDを新しい親にする
    if (over) {
      setParent(over.id as string);
    }
  };

  // ドラッグ可能なタスク（共通パーツ）
  const task = (
    <Draggable id="draggable-task">
      💩タスク
    </Draggable>
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="h-screen w-screen bg-gray-100 flex flex-col p-4 overflow-hidden">
        <h1 className="text-3xl font-black text-center mb-6 text-indigo-600">
          7 Habits Matrix
        </h1>

        <div className="grid grid-cols-2 grid-rows-2 flex-1 gap-4">
          {/* 第1領域 */}
          <Droppable id="q1">
            <div className={`h-full border-2 p-4 rounded-xl transition-colors ${parent === 'q1' ? 'bg-red-100 border-red-400' : 'bg-red-50 border-red-200'}`}>
              <h2 className="font-bold text-red-700 mb-2">第1領域：緊急かつ重要</h2>
              {parent === 'q1' && task}
            </div>
          </Droppable>

          {/* 第3領域 */}
          <Droppable id="q3">
            <div className={`h-full border-2 p-4 rounded-xl transition-colors ${parent === 'q3' ? 'bg-yellow-100 border-yellow-400' : 'bg-yellow-50 border-yellow-200'}`}>
              <h2 className="font-bold text-yellow-700 mb-2">第3領域：緊急だが重要でない</h2>
              {parent === 'q3' && task}
            </div>
          </Droppable>

          {/* 第2領域 */}
          <Droppable id="q2">
            <div className={`h-full border-2 p-4 rounded-xl transition-colors ${parent === 'q2' ? 'bg-orange-100 border-orange-400' : 'bg-orange-50 border-orange-200'}`}>
              <h2 className="font-bold text-orange-700 mb-2">第2領域：緊急でないが重要</h2>
              {parent === 'q2' && task}
            </div>
          </Droppable>

          {/* 第4領域 */}
          <Droppable id="q4">
            <div className={`h-full border-2 p-4 rounded-xl transition-colors ${parent === 'q4' ? 'bg-gray-300 border-gray-400' : 'bg-gray-200 border-gray-300'}`}>
              <h2 className="font-bold text-gray-700 mb-2">第4領域：非緊急でなく重要でない</h2>
              {parent === 'q4' && task}
            </div>
          </Droppable>
        </div>
      </div>
    </DndContext>
  );
};