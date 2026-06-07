import { BellOutlined, CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Badge, Button, Dropdown, List, Space, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../services/notificationApi.js';
import { getApiErrorMessage } from '../utils/apiError.js';
import { formatDate } from '../utils/format.js';

const { Text } = Typography;

export function NotificationBell() {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const unreadLabel = useMemo(() => unreadCount > 99 ? '99+' : unreadCount, [unreadCount]);

  const loadNotifications = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [list, count] = await Promise.all([
        notificationApi.list(),
        notificationApi.getUnreadCount()
      ]);
      setItems(list);
      setUnreadCount(count.unreadCount ?? 0);
    } catch (requestError) {
      if (!silent) {
        message.error(getApiErrorMessage(requestError, 'Không thể tải thông báo.'));
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications({ silent: true });
    const timerId = window.setInterval(() => loadNotifications({ silent: true }), 30000);
    return () => window.clearInterval(timerId);
  }, []);

  const markRead = async (notification) => {
    if (notification.status === 'READ') return;
    try {
      const updated = await notificationApi.markRead(notification.id);
      setItems((current) => current.map((item) => item.id === updated.id ? updated : item));
      setUnreadCount((current) => Math.max(0, current - 1));
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể đánh dấu đã đọc.'));
    }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((current) => current.map((item) => ({
        ...item,
        status: 'READ',
        readAt: item.readAt ?? new Date().toISOString()
      })));
      setUnreadCount(0);
    } catch (requestError) {
      message.error(getApiErrorMessage(requestError, 'Không thể đánh dấu tất cả đã đọc.'));
    }
  };

  const openNotification = async (notification) => {
    await markRead(notification);

    if (notification.referenceType === 'WithdrawalRequest') {
      navigate(`/student/wallet?withdrawalId=${notification.referenceId}`);
      setOpen(false);
      return;
    }

    if (notification.type === 'PROJECT_DEADLINES_UPDATED' || notification.referenceType === 'ProjectOffer') {
      navigate('/student/offers');
      setOpen(false);
      return;
    }

    if (notification.referenceType === 'Project') {
      navigate(`/projects/${notification.referenceId}/execution`);
      setOpen(false);
    }
  };

  const dropdown = (
    <div className="notification-panel">
      <div className="notification-panel-header">
        <strong>Thông báo</strong>
        <Space>
          <Button size="small" icon={<ReloadOutlined />} loading={loading} onClick={() => loadNotifications()}>
            Tải lại
          </Button>
          <Button size="small" icon={<CheckOutlined />} disabled={unreadCount === 0} onClick={markAllRead}>
            Đã đọc
          </Button>
        </Space>
      </div>
      <List
        loading={loading}
        dataSource={items}
        locale={{ emptyText: 'Chưa có thông báo.' }}
        renderItem={(item) => (
          <List.Item
            className={item.status === 'UNREAD' ? 'notification-item unread' : 'notification-item'}
            onClick={() => openNotification(item)}
          >
            <List.Item.Meta
              title={(
                <Space direction="vertical" size={2} className="notification-title-stack">
                  <Text strong={item.status === 'UNREAD'}>{item.title}</Text>
                  <span className="muted-text">{formatDate(item.createdAt)}</span>
                </Space>
              )}
              description={(
                <div className="notification-body">{item.body}</div>
              )}
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Dropdown
      dropdownRender={() => dropdown}
      trigger={['click']}
      placement="bottomRight"
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (nextOpen) loadNotifications({ silent: true });
      }}
    >
      <Button className="notification-button" aria-label="Mở thông báo" icon={(
        <Badge count={unreadLabel} size="small" offset={[4, -4]}>
          <BellOutlined />
        </Badge>
      )} />
    </Dropdown>
  );
}
