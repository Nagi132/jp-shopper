// src/app/cursor-test/page.js
export default function CursorTest() {
    return (
      <div className="p-10">
        <h1>Cursor Test</h1>
        <div 
          className="w-full h-64 bg-gray-200 flex items-center justify-center cursor-win-default"
          style={{ cursor: `url('/cursors/Move.cur'), default` }}
        >
          This area should have a custom cursor
        </div>
      </div>
    );
  }