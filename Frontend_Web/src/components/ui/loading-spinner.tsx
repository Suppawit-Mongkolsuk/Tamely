// ===== Loading Spinner =====
// ใช้แสดงระหว่างโหลดข้อมูล

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const sizeMap = {
  sm: 'size-6 border-2',
  md: 'size-10 border-3',
  lg: 'size-16 border-4',
};

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className={`${sizeMap[size]} rounded-full border-muted-foreground/20 border-t-primary animate-spin`}
      />
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );
}
