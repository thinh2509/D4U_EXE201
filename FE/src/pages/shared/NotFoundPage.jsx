import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';

export function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="center-page">
      <Result
        status="404"
        title="Không tìm thấy trang"
        subTitle="Đường dẫn này không tồn tại trong phạm vi MVP hiện tại."
        extra={<Button type="primary" onClick={() => navigate('/')}>Về trang chính</Button>}
      />
    </div>
  );
}
