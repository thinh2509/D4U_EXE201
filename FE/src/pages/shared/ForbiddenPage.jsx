import { SafetyOutlined } from '@ant-design/icons';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { roleHome } from '../../components/RouteGuards.jsx';
import { useAuth } from '../../contexts/AuthContext.jsx';

export function ForbiddenPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="center-page">
      <Result
        icon={<SafetyOutlined />}
        status="403"
        title="Bạn không có quyền truy cập"
        subTitle="Tài khoản của bạn không được phép truy cập khu vực này."
        extra={<Button type="primary" onClick={() => navigate(roleHome(user?.role), { replace: true })}>Quay về trang phù hợp</Button>}
      />
    </div>
  );
}
