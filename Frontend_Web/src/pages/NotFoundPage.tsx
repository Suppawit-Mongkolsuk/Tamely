import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-6xl font-bold text-gray-800">404</h1>
      <p className="text-xl text-gray-500">ไม่พบหน้าที่ต้องการ</p>
      <Link to="/" className="text-blue-500 underline hover:text-blue-700">
        กลับหน้าหลัก
      </Link>
    </div>
  );
}
