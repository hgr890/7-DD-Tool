import { useDraggable } from '@dnd-kit/core';

// exportをつけて外部から呼べるようにする
// 引数 (props) で id や中身を受け取れるようにする
export function Draggable({ id, children }: { id: string, children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });

  // ドラッグ中の「移動距離」をスタイルに反映,ボタンを動かす
  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 999, // 重なり順を一番上にする
  } : undefined;

  return (
    <button
      ref={setNodeRef}   // ref={ref} から setNodeRef に変更
      style={style}      // 動いた位置をリアルタイムに反映
      {...listeners}     // マウスやタッチ操作を有効化
      {...attributes}    // アクセシビリティ用の属性を付与
      className="bg-white border-2 border-indigo-500 text-indigo-700 px-4 py-2 rounded-lg shadow-md cursor-grab active:cursor-grabbing touch-none font-bold"
    >
      {children}
    </button>
  );
}