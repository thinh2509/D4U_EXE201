import { BellOutlined, CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Badge, Button, Dropdown, List, Space, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { notificationApi } from '../services/notificationApi.js';
import { getApiErrorMessage } from '../utils/apiError.js';
import { formatDate } from '../utils/format.js';

const { Text } = Typography;

function resolveNotificationPath(notification, role) {
  if (notification.referenceType === 'WithdrawalRequest') {
    return `/student/wallet?withdrawalId=${notification.referenceId}`;
  }

  if (notification.referenceType === 'Project') {
    return notification.referenceId ? `/projects/${notification.referenceId}/execution` : null;
  }

  if (role === 'SME') {
    if (notification.type === 'APPLICATION_SUBMITTED' || notification.referenceType === 'ProjectApplication') {
      return '/sme/applications';
    }

    if (
      [
        'OFFER_ACCEPTED',
        'OFFER_REJECTED',
        'PAYMENT_FAILED',
        'PAYMENT_WINDOW_EXPIRED'
      ].includes(notification.type) ||
      notification.referenceType === 'ProjectOffer' ||
      notification.referenceType === 'Payment'
    ) {
      return '/sme/offers';
    }

    if (notification.type === 'NEW_SUBMISSION' || notification.type === 'REVIEW_ACTION') {
      return '/sme/projects';
    }
  }

  if (role === 'STUDENT') {
    if (
      ['PROJECT_DEADLINES_UPDATED', 'NEW_OFFER'].includes(notification.type) ||
      notification.referenceType === 'ProjectOffer'
    ) {
      return '/student/offers';
    }
  }

  return null;
}

export function NotificationBell() {
  const { message } = App.useApp();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const unreadLabel = useMemo(() => (unreadCount > 99 ? '99+' : unreadCount), [unreadCount]);

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
      setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
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
    const destination = resolveNotificationPath(notification, user?.role);
    if (destination) {
      navigate(destination);
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
              description={<div className="notification-body">{item.body}</div>}
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
      <Button
        className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-d4u-border/80 bg-white/95 p-0 text-d4u-teal-deep shadow-sm backdrop-blur transition-all duration-150 hover:!border-d4u-cyan hover:!bg-d4u-soft-2 hover:shadow-soft focus-visible:!border-d4u-cyan focus-visible:!outline-none focus-visible:shadow-focus"
        aria-label="Mở thông báo"
        icon={(
          <Badge count={unreadLabel} size="small" offset={[2, -1]} className="grid place-items-center [&_.ant-badge-count]:!px-1.5 [&_.ant-badge-count]:!py-0 [&_.ant-badge-count]:!text-[10px] [&_.ant-badge-count]:!font-black [&_.ant-badge-count]:!leading-[18px] [&_.ant-badge-count]:shadow-sm">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-d4u-soft text-d4u-teal-deep transition-all duration-150 group-hover:bg-white group-hover:text-d4u-cyan">
              <BellOutlined className="text-[18px] font-black text-current" />
            </span>
          </Badge>
        )}
      />
    </Dropdown>
  );
}
