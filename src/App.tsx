export const App = () => {
  return (
    <div className="h-screen w-screen bg-gray-100 flex flex-col p-4">
      <h1 className="text-3xl font-black text-center mb-6 text-indigo-600">7 Habits Matrix</h1>
      <div className="grid grid-cols-2 grid-rows-2 flex-1 gap-4">
        <div className="bg-red-50 border-2 border-red-200 p-4 rounded-lg">第1領域：緊急かつ重要</div>
        <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg">第3領域：緊急だが重要でない</div>
        <div className="bg-yellow-50 border-2 border-yellow-200 p-4 rounded-lg">第2領域：緊急でないが重要</div>
        <div className="bg-gray-200 border-2 border-gray-300 p-4 rounded-lg">第4領域：緊急でなく重要でない</div>
      </div>
    </div>
  )
}