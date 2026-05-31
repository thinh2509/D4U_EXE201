import { Button, Typography, Row, Col, Card, Space, Layout } from 'antd';
import { 
  ArrowRightOutlined, 
  UploadOutlined, 
  TeamOutlined, 
  CheckCircleOutlined,
  StarFilled,
  BgColorsOutlined,
  NotificationOutlined,
  FileImageOutlined,
  MobileOutlined,
  TwitterOutlined,
  FacebookFilled,
  InstagramOutlined,
  LinkedinFilled
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext.jsx';
import { roleHome } from '../../components/RouteGuards.jsx';
import { D4ULogo } from '../../components/D4ULogo.jsx';

const { Title, Paragraph, Text } = Typography;
const { Header, Content, Footer } = Layout;

const POPULAR_SERVICES = [
  {
    icon: BgColorsOutlined,
    title: 'Logo Design',
    description: 'Thiết kế logo chuyên nghiệp, độc đáo cho thương hiệu của bạn',
    gradient: 'linear-gradient(to bottom right, #02577A, #02A9F7)'
  },
  {
    icon: NotificationOutlined,
    title: 'Social Media Design',
    description: 'Thiết kế content hấp dẫn cho các nền tảng mạng xã hội',
    gradient: 'linear-gradient(to bottom right, #02A9F7, #0284C7)'
  },
  {
    icon: FileImageOutlined,
    title: 'Poster Design',
    description: 'Poster, flyer và banner ấn tượng cho sự kiện của bạn',
    gradient: 'linear-gradient(to bottom right, #0EA5E9, #02A9F7)'
  },
  {
    icon: MobileOutlined,
    title: 'UI/UX Design',
    description: 'Thiết kế giao diện app và website thân thiện người dùng',
    gradient: 'linear-gradient(to bottom right, #02577A, #0891B2)'
  }
];

const HOW_IT_WORKS_STEPS = [
  {
    step: 1,
    icon: UploadOutlined,
    title: 'Đăng dự án thiết kế',
    description: 'Mô tả chi tiết dự án và ngân sách của bạn'
  },
  {
    step: 2,
    icon: TeamOutlined,
    title: 'Designer gửi proposal',
    description: 'Nhận đề xuất từ designer phù hợp'
  },
  {
    step: 3,
    icon: CheckCircleOutlined,
    title: 'Chọn designer & nhận sản phẩm',
    description: 'Làm việc trực tiếp và nhận thiết kế hoàn chỉnh'
  }
];

const FEATURED_DESIGNERS = [
  {
    name: 'Nguyễn Minh Anh',
    specialty: 'UI/UX Designer',
    rating: 4.9,
    reviews: 127,
    avatar: 'https://images.unsplash.com/photo-1675388545634-83d816322c83?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmZW1hbGUlMjBhc2lhbiUyMGRlc2lnbmVyJTIwcG9ydHJhaXR8ZW58MXx8fHwxNzcyOTAyNjYxfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    name: 'Trần Văn Hùng',
    specialty: 'Graphic Designer',
    rating: 4.8,
    reviews: 98,
    avatar: 'https://images.unsplash.com/photo-1761522002071-67755dc6c820?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYWxlJTIwZGVzaWduZXIlMjBwcm9mZXNzaW9uYWwlMjBwb3J0cmFpdHxlbnwxfHx8fDE3NzI5MDI2NjJ8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    name: 'Lê Thu Hà',
    specialty: 'Brand Designer',
    rating: 5.0,
    reviews: 156,
    avatar: 'https://images.unsplash.com/photo-1764737740462-2a310c7b2c39?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMGRlc2lnbmVyJTIwY3JlYXRpdmUlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzcyOTAyNjYyfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    name: 'Phạm Đức Minh',
    specialty: 'Illustrator',
    rating: 4.7,
    reviews: 83,
    avatar: 'https://images.unsplash.com/photo-1758519289361-2615778e0e5d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMHByb2Zlc3Npb25hbCUyMGhhcHB5JTIwY2xpZW50fGVufDF8fHx8MTc3MjkwMjY2NHww&ixlib=rb-4.1.0&q=80&w=1080',
  }
];

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
    <Layout style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: '"Inter", sans-serif' }}>
      {/* Navigation */}
      <Header style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.8)', 
        backdropFilter: 'blur(16px)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        padding: '0 48px', 
        borderBottom: '1px solid #E2E8F0', 
        position: 'sticky', 
        top: 0, 
        zIndex: 50,
        height: '80px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
          <D4ULogo />
          <Space size="large" style={{ display: 'none', '@media (min-width: 768px)': { display: 'flex' } }}>
            <Link to="/" style={{ color: '#1E293B', fontWeight: 500, fontSize: '15px' }}>Trang chủ</Link>
            <Link to="#" style={{ color: '#64748B', fontWeight: 500, fontSize: '15px' }}>Tìm Designer</Link>
            <Link to="#" style={{ color: '#64748B', fontWeight: 500, fontSize: '15px' }}>Dự án</Link>
            <Link to="#" style={{ color: '#64748B', fontWeight: 500, fontSize: '15px' }}>Về chúng tôi</Link>
          </Space>
        </div>
        <Space size="middle">
          {user ? (
            <Button type="primary" onClick={() => navigate(roleHome(user.role))} style={{ height: '44px', borderRadius: '12px', padding: '0 24px', fontWeight: 600, background: 'linear-gradient(to right, #02577A, #02A9F7)', border: 'none' }}>
              Đi tới Dashboard
            </Button>
          ) : (
            <>
              <Button onClick={() => navigate('/login')} style={{ height: '44px', borderRadius: '12px', padding: '0 24px', fontWeight: 600, color: '#02A9F7', borderColor: '#02A9F7' }}>
                Đăng nhập
              </Button>
              <Button type="primary" onClick={() => navigate('/register')} style={{ height: '44px', borderRadius: '12px', padding: '0 24px', fontWeight: 600, background: 'linear-gradient(to right, #02577A, #02A9F7)', border: 'none', boxShadow: '0 4px 14px 0 rgba(2, 169, 247, 0.39)' }}>
                Đăng dự án
              </Button>
            </>
          )}
        </Space>
      </Header>
      
      <Content>
        {/* Hero Section */}
        <section style={{ backgroundColor: '#FFFFFF', padding: '96px 48px 128px' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <Row gutter={[64, 64]} align="middle">
              <Col xs={24} lg={12}>
                <Title style={{ fontSize: '72px', fontWeight: 800, color: '#1E293B', lineHeight: 1.2, margin: '0 0 32px 0', letterSpacing: '-0.02em' }}>
                  <div style={{ display: 'block', marginBottom: '8px' }}>Thuê Designer</div>
                  <div style={{ display: 'block', marginBottom: '8px' }}>
                    <span style={{ 
                      background: 'linear-gradient(to right, #02577A, #0284C7, #02A9F7)', 
                      WebkitBackgroundClip: 'text', 
                      color: 'transparent' 
                    }}>Tài Năng</span>
                  </div>
                  <div style={{ display: 'block' }}>Cho Dự Án Của Bạn</div>
                </Title>
                <Paragraph style={{ fontSize: '20px', color: '#64748B', marginBottom: '40px', lineHeight: 1.6, maxWidth: '560px' }}>
                  Kết nối với sinh viên thiết kế sáng tạo từ các trường đại học hàng đầu. 
                  Chất lượng cao, giá cả hợp lý, quy trình đơn giản.
                </Paragraph>
                <Space size="middle">
                  <Button type="primary" onClick={handleCTA} style={{ height: '56px', borderRadius: '12px', padding: '0 32px', fontSize: '16px', fontWeight: 600, background: 'linear-gradient(to right, #02577A, #02A9F7)', border: 'none', boxShadow: '0 10px 25px -5px rgba(2, 169, 247, 0.4)' }}>
                    Đăng dự án ngay <ArrowRightOutlined style={{ marginLeft: '8px' }} />
                  </Button>
                  <Button onClick={handleCTA} style={{ height: '56px', borderRadius: '12px', padding: '0 32px', fontSize: '16px', fontWeight: 600, color: '#1E293B', borderColor: '#CBD5E1' }}>
                    Tìm Designer
                  </Button>
                </Space>
              </Col>
              <Col xs={24} lg={12}>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'relative', zIndex: 2 }}>
                    <img src="/brand/hero-laptops.png" alt="D4U Dashboards" style={{ width: '100%', height: 'auto', maxHeight: '550px', objectFit: 'contain', display: 'block' }} />
                  </div>
                  <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '200px', height: '200px', background: 'linear-gradient(to bottom right, #02577A, #02A9F7)', borderRadius: '50%', opacity: 0.15, filter: 'blur(40px)', zIndex: 1 }} />
                </div>
              </Col>
            </Row>
          </div>
        </section>

        {/* Popular Services Section */}
        <section style={{ backgroundColor: '#F8FAFC', padding: '128px 48px' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <Title level={2} style={{ fontSize: '48px', fontWeight: 800, color: '#1E293B', marginBottom: '24px' }}>
                Dịch vụ <span style={{ background: 'linear-gradient(to right, #02577A, #02A9F7)', WebkitBackgroundClip: 'text', color: 'transparent' }}>phổ biến</span>
              </Title>
              <Paragraph style={{ fontSize: '20px', color: '#64748B' }}>
                Khám phá các dịch vụ thiết kế được yêu thích nhất
              </Paragraph>
            </div>
            
            <Row gutter={[32, 32]}>
              {POPULAR_SERVICES.map((service, index) => (
                <Col xs={24} sm={12} lg={6} key={index}>
                  <Card bordered={true} style={{ height: '100%', borderRadius: '24px', borderColor: '#E2E8F0', padding: '8px' }} bodyStyle={{ padding: '24px' }} hoverable>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: service.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                      <service.icon style={{ fontSize: '32px', color: '#FFFFFF' }} />
                    </div>
                    <Title level={3} style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', marginBottom: '12px' }}>
                      {service.title}
                    </Title>
                    <Paragraph style={{ color: '#64748B', lineHeight: 1.6, margin: 0, fontSize: '15px' }}>
                      {service.description}
                    </Paragraph>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* How it works Section */}
        <section style={{ backgroundColor: '#FFFFFF', padding: '128px 48px' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <Title level={2} style={{ fontSize: '48px', fontWeight: 800, color: '#1E293B', marginBottom: '24px' }}>
                D4U hoạt động <span style={{ background: 'linear-gradient(to right, #02577A, #02A9F7)', WebkitBackgroundClip: 'text', color: 'transparent' }}>như thế nào?</span>
              </Title>
              <Paragraph style={{ fontSize: '20px', color: '#64748B' }}>
                Ba bước đơn giản để bắt đầu dự án thiết kế của bạn
              </Paragraph>
            </div>
            
            <Row gutter={[48, 48]} justify="center">
              {HOW_IT_WORKS_STEPS.map((step, index) => (
                <Col xs={24} md={8} key={index}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-block', position: 'relative', marginBottom: '32px' }}>
                      <div style={{ width: '112px', height: '112px', borderRadius: '24px', background: 'linear-gradient(to bottom right, #02577A, #02A9F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 25px -5px rgba(2, 169, 247, 0.3)' }}>
                        <step.icon style={{ fontSize: '56px', color: '#FFFFFF' }} />
                      </div>
                      <div style={{ position: 'absolute', top: '-12px', right: '-12px', width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FFFFFF', border: '4px solid #FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
                        <span style={{ fontSize: '20px', fontWeight: 700, background: 'linear-gradient(to right, #02577A, #02A9F7)', WebkitBackgroundClip: 'text', color: 'transparent' }}>
                          {step.step}
                        </span>
                      </div>
                    </div>
                    <Title level={3} style={{ fontSize: '24px', fontWeight: 700, color: '#1E293B', marginBottom: '16px' }}>
                      {step.title}
                    </Title>
                    <Paragraph style={{ fontSize: '18px', color: '#64748B', lineHeight: 1.6 }}>
                      {step.description}
                    </Paragraph>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* Featured Designers */}
        <section style={{ backgroundColor: '#F8FAFC', padding: '128px 48px' }}>
          <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '80px' }}>
              <Title level={2} style={{ fontSize: '48px', fontWeight: 800, color: '#1E293B', marginBottom: '24px' }}>
                Designer <span style={{ background: 'linear-gradient(to right, #02577A, #02A9F7)', WebkitBackgroundClip: 'text', color: 'transparent' }}>nổi bật</span>
              </Title>
              <Paragraph style={{ fontSize: '20px', color: '#64748B' }}>
                Những tài năng hàng đầu với portfolio ấn tượng
              </Paragraph>
            </div>
            
            <Row gutter={[32, 32]}>
              {FEATURED_DESIGNERS.map((designer, index) => (
                <Col xs={24} sm={12} lg={6} key={index}>
                  <Card 
                    bordered={true} 
                    style={{ height: '100%', borderRadius: '24px', overflow: 'hidden', borderColor: '#E2E8F0' }} 
                    bodyStyle={{ padding: 0 }}
                    hoverable
                  >
                    <div style={{ height: '320px', overflow: 'hidden', background: 'linear-gradient(to bottom right, #ECFEFF, #F0F9FF)' }}>
                      <img src={designer.avatar} alt={designer.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ padding: '24px' }}>
                      <Title level={3} style={{ fontSize: '20px', fontWeight: 700, color: '#1E293B', marginBottom: '8px' }}>{designer.name}</Title>
                      <Paragraph style={{ color: '#64748B', marginBottom: '16px' }}>{designer.specialty}</Paragraph>
                      
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid #F1F5F9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <StarFilled style={{ fontSize: '20px', color: '#F59E0B' }} />
                          <span style={{ fontWeight: 600, color: '#1E293B', fontSize: '18px' }}>{designer.rating}</span>
                          <span style={{ color: '#64748B' }}>({designer.reviews})</span>
                        </div>
                        <Button type="text" style={{ color: '#02A9F7', fontWeight: 600, padding: 0 }}>
                          Xem hồ sơ
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ background: 'linear-gradient(to bottom right, #02577A, #0284C7, #02A9F7)', padding: '128px 48px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', maxWidth: '1440px', margin: '0 auto', textAlign: 'center', zIndex: 2 }}>
            <Title level={2} style={{ fontSize: '60px', fontWeight: 800, color: '#FFFFFF', marginBottom: '32px', lineHeight: 1.2 }}>
              Sẵn sàng bắt đầu<br />dự án thiết kế của bạn?
            </Title>
            <Paragraph style={{ fontSize: '24px', color: '#ECFEFF', marginBottom: '48px', maxWidth: '672px', margin: '0 auto 48px', lineHeight: 1.6 }}>
              Hàng nghìn designer tài năng đang chờ đợi để biến ý tưởng của bạn thành hiện thực
            </Paragraph>
            <Button onClick={handleCTA} style={{ height: '64px', borderRadius: '12px', padding: '0 48px', fontSize: '18px', fontWeight: 700, color: '#02577A', backgroundColor: '#FFFFFF', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}>
              Đăng dự án miễn phí <ArrowRightOutlined style={{ marginLeft: '8px' }} />
            </Button>
          </div>
        </section>
      </Content>

      {/* Footer */}
      <Footer style={{ background: 'linear-gradient(to bottom right, #02577A, #013F5A, #272425)', padding: '80px 48px 40px', color: '#94A3B8' }}>
        <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
          <Row gutter={[48, 48]} style={{ marginBottom: '64px' }}>
            <Col xs={24} md={10}>
              <div style={{ marginBottom: '24px', backgroundColor: '#FFFFFF', padding: '12px 24px', borderRadius: '16px', display: 'inline-block' }}>
                <D4ULogo />
              </div>
              <Paragraph style={{ color: '#94A3B8', fontSize: '16px', lineHeight: 1.6, maxWidth: '448px', marginBottom: '32px' }}>
                Nền tảng kết nối hàng đầu giữa sinh viên thiết kế tài năng và các doanh nghiệp. Tạo cơ hội, xây dựng tương lai.
              </Paragraph>
              <Space size="middle">
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <TwitterOutlined style={{ fontSize: '20px', color: '#94A3B8' }} />
                </div>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <FacebookFilled style={{ fontSize: '20px', color: '#94A3B8' }} />
                </div>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <InstagramOutlined style={{ fontSize: '20px', color: '#94A3B8' }} />
                </div>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                  <LinkedinFilled style={{ fontSize: '20px', color: '#94A3B8' }} />
                </div>
              </Space>
            </Col>
            <Col xs={24} md={14}>
              <Row gutter={[32, 32]}>
                <Col xs={12} sm={8}>
                  <Title level={4} style={{ color: '#FFFFFF', fontSize: '16px', marginBottom: '24px' }}>Sản phẩm</Title>
                  <Space direction="vertical" size="middle">
                    <Text style={{ color: '#94A3B8', cursor: 'pointer' }}>Tìm Designer</Text>
                    <Text style={{ color: '#94A3B8', cursor: 'pointer' }}>Đăng dự án</Text>
                    <Text style={{ color: '#94A3B8', cursor: 'pointer' }}>Dịch vụ</Text>
                    <Text style={{ color: '#94A3B8', cursor: 'pointer' }}>Bảng giá</Text>
                  </Space>
                </Col>
                <Col xs={12} sm={8}>
                  <Title level={4} style={{ color: '#FFFFFF', fontSize: '16px', marginBottom: '24px' }}>Về chúng tôi</Title>
                  <Space direction="vertical" size="middle">
                    <Text style={{ color: '#94A3B8', cursor: 'pointer' }}>Giới thiệu</Text>
                    <Text style={{ color: '#94A3B8', cursor: 'pointer' }}>Blog</Text>
                    <Text style={{ color: '#94A3B8', cursor: 'pointer' }}>Liên hệ</Text>
                    <Text style={{ color: '#94A3B8', cursor: 'pointer' }}>Cơ hội nghề nghiệp</Text>
                  </Space>
                </Col>
                <Col xs={12} sm={8}>
                  <Title level={4} style={{ color: '#FFFFFF', fontSize: '16px', marginBottom: '24px' }}>Hỗ trợ</Title>
                  <Space direction="vertical" size="middle">
                    <Text style={{ color: '#94A3B8', cursor: 'pointer' }}>Trung tâm trợ giúp</Text>
                    <Text style={{ color: '#94A3B8', cursor: 'pointer' }}>Điều khoản sử dụng</Text>
                    <Text style={{ color: '#94A3B8', cursor: 'pointer' }}>Chính sách bảo mật</Text>
                    <Text style={{ color: '#94A3B8', cursor: 'pointer' }}>FAQs</Text>
                  </Space>
                </Col>
              </Row>
            </Col>
          </Row>
          
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <Text style={{ color: '#94A3B8' }}>© 2026 D4U - Design For You. All rights reserved.</Text>
            <Space size="large">
              <Text style={{ color: '#94A3B8', cursor: 'pointer' }}>Quyền riêng tư</Text>
              <Text style={{ color: '#94A3B8', cursor: 'pointer' }}>Điều khoản</Text>
              <Text style={{ color: '#94A3B8', cursor: 'pointer' }}>Cookies</Text>
            </Space>
          </div>
        </div>
      </Footer>
    </Layout>
  );
}
