import { BellOutlined, CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Badge, Button, Dropdown, List, Space, Typography } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { notificationApi } from '../services/notificationApi.js';
import { createNotificationConnection } from '../services/notificationRealtime.js';
import { getApiErrorMessage } from '../utils/apiError.js';
import { formatDate } from '../utils/format.js';

const { Text } = Typography;

function resolveNotificationPath(notification, role) {
  if (notification.referenceType === 'WithdrawalRequest') {
    return '/student/wallet';
  }

  if (role === 'SME') {
    if (notification.type === 'APPLICATION_SUBMITTED' || notification.referenceType === 'ProjectApplication') {
      return '/sme/applications';
    }

    if (
      [
        'OFFER_ACCEPTED',
        'OFFER_REJECTED',
        'ESCROW_FUNDED',
        'PAYMENT_FAILED',
        'PAYMENT_WINDOW_EXPIRED',
      ].includes(notification.type) ||
      notification.referenceType === 'ProjectOffer' ||
      notification.referenceType === 'Payment'
    ) {
      return '/sme/offers';
    }

    if (
      ['PROJECT_AUTO_CANCELLED', 'PROJECT_CANCELLED', 'NEW_SUBMISSION', 'REVIEW_ACTION'].includes(notification.type)
    ) {
      return '/sme/projects';
    }
  }

  if (role === 'STUDENT') {
    if (
      ['NEW_OFFER', 'PROJECT_DEADLINES_UPDATED'].includes(notification.type) ||
      notification.referenceType === 'ProjectOffer'
    ) {
      return '/student/offers';
    }

    if (['PROJECT_CANCELLED', 'PROJECT_AUTO_CANCELLED'].includes(notification.type)) {
      return '/student/applications';
    }
  }

  if (notification.referenceType === 'Project') {
    return notification.referenceId ? `/projects/${notification.referenceId}/execution` : null;
  }

  return null;
}

function upsertNotification(currentItems, incomingItem) {
  const existingIndex = currentItems.findIndex((item) => item.id === incomingItem.id);
  if (existingIndex === -1) {
    return [incomingItem, ...currentItems].slice(0, 20);
  }

  return currentItems.map((item) => (item.id === incomingItem.id ? incomingItem : item));
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

  const loadNotifications = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);

    try {
      const [list, count] = await Promise.all([
        notificationApi.list(),
        notificationApi.getUnreadCount(),
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
  }, [message]);

  useEffect(() => {
    if (!user) return undefined;

    loadNotifications({ silent: true });
    const timerId = window.setInterval(() => loadNotifications({ silent: true }), 30000);
    return () => window.clearInterval(timerId);
  }, [loadNotifications, user]);

  useEffect(() => {
    if (!user) return undefined;

    const connection = createNotificationConnection();
    let disposed = false;

    const handleCreated = (notification) => {
      setItems((current) => upsertNotification(current, notification));
    };

    const handleUpdated = (notification) => {
      setItems((current) => upsertNotification(current, notification));
    };

    const handleUnreadCountChanged = (payload) => {
      setUnreadCount(payload?.unreadCount ?? 0);
    };

    const handleMarkedAllRead = (payload) => {
      setItems((current) => current.map((item) => ({
        ...item,
        status: 'READ',
        readAt: item.readAt ?? payload?.readAt ?? new Date().toISOString(),
      })));
      setUnreadCount(0);
    };

    connection.on('notificationCreated', handleCreated);
    connection.on('notificationUpdated', handleUpdated);
    connection.on('notificationUnreadCountChanged', handleUnreadCountChanged);
    connection.on('notificationsMarkedAllRead', handleMarkedAllRead);

    connection.start().catch(() => {
      if (!disposed) {
        loadNotifications({ silent: true });
      }
    });

    return () => {
      disposed = true;
      connection.off('notificationCreated', handleCreated);
      connection.off('notificationUpdated', handleUpdated);
      connection.off('notificationUnreadCountChanged', handleUnreadCountChanged);
      connection.off('notificationsMarkedAllRead', handleMarkedAllRead);
      connection.stop().catch(() => {});
    };
  }, [loadNotifications, user]);

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
        readAt: item.readAt ?? new Date().toISOString(),
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
        className="group inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-d4u-border/90 bg-white p-0 text-d4u-teal-deep shadow-none transition-all duration-150 hover:!border-d4u-cyan/45 hover:!bg-white hover:shadow-sm focus-visible:!border-d4u-cyan focus-visible:!outline-none focus-visible:shadow-focus"
        aria-label="Mở thông báo"
        icon={(
          <Badge count={unreadLabel} size="small" offset={[-2, 4]} className="grid place-items-center [&_.ant-badge-count]:!min-w-[18px] [&_.ant-badge-count]:!h-[18px] [&_.ant-badge-count]:!border-2 [&_.ant-badge-count]:!border-white [&_.ant-badge-count]:!bg-red-500 [&_.ant-badge-count]:!px-0 [&_.ant-badge-count]:!text-[10px] [&_.ant-badge-count]:!font-black [&_.ant-badge-count]:!leading-[14px] [&_.ant-badge-count]:shadow-sm">
            <span className="inline-flex h-7 w-7 items-center justify-center text-d4u-teal-deep transition-all duration-150 group-hover:text-d4u-cyan">
              <BellOutlined className="text-[18px] font-black text-current" />
            </span>
          </Badge>
        )}
      />
    </Dropdown>
  );
}
