import { BellOutlined, CheckOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Badge, Button, Dropdown, List, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { notificationApi } from '../services/notificationApi.js';
import { getApiErrorMessage } from '../utils/apiError.js';
import { formatDate } from '../utils/format.js';

const { Text } = Typography;

const notificationTypeColors = {
  NEW_OFFER: 'cyan',
  PAYMENT_SUCCESS: 'green',
  NEW_SUBMISSION: 'blue',
  REVIEW_ACTION: 'gold',
  ESCROW_RELEASED: 'green'
};

export function NotificationBell() {
  const { message } = App.useApp();
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
        message.error(getApiErrorMessage(requestError, 'Khong the tai thong bao.'));
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
      message.error(getApiErrorMessage(requestError, 'Khong the danh dau da doc.'));
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
      message.error(getApiErrorMessage(requestError, 'Khong the danh dau tat ca da doc.'));
    }
  };

  const dropdown = (
    <div className="notification-panel">
      <div className="notification-panel-header">
        <strong>Thong bao</strong>
        <Space>
          <Button size="small" icon={<ReloadOutlined />} loading={loading} onClick={() => loadNotifications()}>
            Tai lai
          </Button>
          <Button size="small" icon={<CheckOutlined />} disabled={unreadCount === 0} onClick={markAllRead}>
            Da doc
          </Button>
        </Space>
      </div>
      <List
        loading={loading}
        dataSource={items}
        locale={{ emptyText: 'Chua co thong bao.' }}
        renderItem={(item) => (
          <List.Item
            className={item.status === 'UNREAD' ? 'notification-item unread' : 'notification-item'}
            onClick={() => markRead(item)}
          >
            <List.Item.Meta
              title={(
                <Space wrap>
                  <Text strong={item.status === 'UNREAD'}>{item.title}</Text>
                  <Tag color={notificationTypeColors[item.type] || 'default'}>{item.type}</Tag>
                </Space>
              )}
              description={(
                <div>
                  <div>{item.body}</div>
                  <span className="muted-text">{formatDate(item.createdAt)}</span>
                </div>
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
      <Button className="notification-button" icon={(
        <Badge count={unreadLabel} size="small" offset={[4, -4]}>
          <BellOutlined />
        </Badge>
      )} />
    </Dropdown>
  );
}
