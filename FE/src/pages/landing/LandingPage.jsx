import { Button, Typography, Row, Col, Card, Space, Layout } from 'antd';
import { ArrowRightOutlined, SafetyCertificateOutlined, DollarOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { roleHome } from '../../components/RouteGuards.jsx';
import { D4ULogo } from '../../components/D4ULogo.jsx';

const { Title, Paragraph } = Typography;
const { Header, Content, Footer } = Layout;

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (user) {
      navigate(roleHome(user.role));
    } else {
      navigate('/register');
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <Header style={{ backgroundColor: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 50px', borderBottom: '1px solid #EAF3F7', position: 'sticky', top: 0, zIndex: 10 }}>
        <D4ULogo />
        <Space>
          {user ? (
            <Button type="primary" onClick={() => navigate(roleHome(user.role))}>
              Đi tới Dashboard
            </Button>
          ) : (
            <>
              <Link to="/login"><Button type="text">Đăng nhập</Button></Link>
              <Link to="/register"><Button type="primary">Đăng ký ngay</Button></Link>
            </>
          )}
        </Space>
      </Header>
      
      <Content>
        {/* Hero Section */}
        <div style={{ backgroundColor: '#F6FAFD', padding: '100px 50px', textAlign: 'center', background: 'linear-gradient(180deg, #F6FAFD 0%, #FFFFFF 100%)' }}>
          <Title style={{ fontSize: '48px', fontWeight: 800, color: '#1D2428', marginBottom: '24px' }}>
            Kết nối <span style={{ color: '#12AEEA' }}>Sinh viên thiết kế</span> với <span style={{ color: '#0EA5E9' }}>Doanh nghiệp</span>
          </Title>
          <Paragraph style={{ fontSize: '20px', color: '#667985', maxWidth: '800px', margin: '0 auto 48px' }}>
            Nền tảng giúp Doanh nghiệp tìm kiếm nhân tài thiết kế trẻ với chi phí tối ưu, đồng thời mang đến cơ hội việc làm thực tế và xây dựng hồ sơ năng lực cho Sinh viên.
          </Paragraph>
          <Space size="large" style={{ marginBottom: '40px' }} wrap>
            <Button type="primary" size="large" icon={<ArrowRightOutlined />} onClick={handleCTA} style={{ height: '56px', padding: '0 32px', fontSize: '18px', fontWeight: 600, borderRadius: '28px' }}>
              Tuyển Designer ngay
            </Button>
            <Button size="large" onClick={handleCTA} style={{ height: '56px', padding: '0 32px', fontSize: '18px', fontWeight: 600, borderRadius: '28px', borderColor: '#12AEEA', color: '#12AEEA' }}>
              Tìm việc thiết kế
            </Button>
          </Space>
        </div>

        {/* Features Section */}
        <div style={{ padding: '80px 50px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <Title level={2} style={{ color: '#1D2428' }}>Tại sao chọn D4U?</Title>
            <Paragraph style={{ fontSize: '16px', color: '#667985' }}>Nền tảng thiết kế tối ưu dành riêng cho thị trường Việt Nam</Paragraph>
          </div>
          <Row gutter={[32, 32]}>
            <Col xs={24} md={8}>
              <Card bordered={false} style={{ height: '100%', borderRadius: '16px', backgroundColor: '#F6FAFD', textAlign: 'center' }}>
                <DollarOutlined style={{ fontSize: '48px', color: '#16A34A', marginBottom: '24px' }} />
                <Title level={4}>Tiết kiệm chi phí</Title>
                <Paragraph style={{ color: '#667985' }}>Dành cho doanh nghiệp vừa và nhỏ, tìm kiếm giải pháp thiết kế chất lượng với ngân sách hợp lý từ nguồn lực sinh viên năng động.</Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card bordered={false} style={{ height: '100%', borderRadius: '16px', backgroundColor: '#F6FAFD', textAlign: 'center' }}>
                <SafetyCertificateOutlined style={{ fontSize: '48px', color: '#12AEEA', marginBottom: '24px' }} />
                <Title level={4}>Giao dịch an toàn</Title>
                <Paragraph style={{ color: '#667985' }}>Hệ thống thanh toán ký quỹ (Escrow) đảm bảo 100% quyền lợi. Doanh nghiệp nhận được sản phẩm ưng ý, sinh viên nhận được thù lao.</Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={8}>
              <Card bordered={false} style={{ height: '100%', borderRadius: '16px', backgroundColor: '#F6FAFD', textAlign: 'center' }}>
                <ThunderboltOutlined style={{ fontSize: '48px', color: '#F59E0B', marginBottom: '24px' }} />
                <Title level={4}>Nhanh chóng & Tiện lợi</Title>
                <Paragraph style={{ color: '#667985' }}>Quy trình đăng dự án, ứng tuyển, xét duyệt và bàn giao sản phẩm được tối ưu hoá, giúp tiết kiệm thời gian cho cả hai bên.</Paragraph>
              </Card>
            </Col>
          </Row>
        </div>

        {/* How it works Section */}
        <div style={{ padding: '80px 50px', backgroundColor: '#1D2428', color: '#FFFFFF' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
            <Title level={2} style={{ color: '#FFFFFF', marginBottom: '60px' }}>Quy trình đơn giản</Title>
            <Row gutter={[32, 32]} align="middle">
              <Col xs={24} md={8}>
                <div style={{ padding: '24px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#12AEEA', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '24px', fontWeight: 'bold' }}>1</div>
                  <Title level={4} style={{ color: '#FFFFFF' }}>Đăng dự án</Title>
                  <Paragraph style={{ color: '#A0B4C0' }}>Doanh nghiệp đăng yêu cầu thiết kế cùng ngân sách mong muốn.</Paragraph>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ padding: '24px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#12AEEA', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '24px', fontWeight: 'bold' }}>2</div>
                  <Title level={4} style={{ color: '#FFFFFF' }}>Kết nối & Ký quỹ</Title>
                  <Paragraph style={{ color: '#A0B4C0' }}>Chọn sinh viên phù hợp và thanh toán vào quỹ đảm bảo (Escrow).</Paragraph>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div style={{ padding: '24px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: '#12AEEA', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '24px', fontWeight: 'bold' }}>3</div>
                  <Title level={4} style={{ color: '#FFFFFF' }}>Nhận sản phẩm</Title>
                  <Paragraph style={{ color: '#A0B4C0' }}>Sinh viên nộp thiết kế. Doanh nghiệp duyệt bài, hệ thống tự động giải ngân.</Paragraph>
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </Content>

      <Footer style={{ textAlign: 'center', backgroundColor: '#FFFFFF', borderTop: '1px solid #EAF3F7', padding: '24px 50px', color: '#667985' }}>
        <D4ULogo />
        <br />
        <div style={{ marginTop: '16px' }}>
          D4U (Design 4 You) MVP ©{new Date().getFullYear()}. All Rights Reserved.
        </div>
      </Footer>
    </Layout>
  );
}
