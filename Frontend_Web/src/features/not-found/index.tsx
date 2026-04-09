// ===== 404 Not Found Page =====
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted text-center px-4">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <h2 className="text-xl text-foreground mb-2">ไม่พบหน้าที่คุณต้องการ</h2>
      <p className="text-muted-foreground mb-8">
        หน้านี้อาจถูกย้าย ลบ หรือ URL ไม่ถูกต้อง
      </p>
      <button
        onClick={() => navigate('/home')}
        className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        กลับหน้าหลัก
      </button>
    </div>
  );
}
