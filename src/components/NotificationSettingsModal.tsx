import React from 'react';
import { SuperAdminSettingsModal, SuperAdminTab } from './SuperAdminSettingsModal';
import { SystemNotification } from '../types';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendTestNotification?: (channel: 'WHATSAPP' | 'EMAIL' | 'BOTH', sampleEvent: string, customText?: string) => void;
  recentLogs?: SystemNotification[];
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  onSendTestNotification,
  recentLogs,
}) => {
  return (
    <SuperAdminSettingsModal
      isOpen={isOpen}
      onClose={onClose}
      currentUser={null}
      initialTab="NOTIFIKASI"
      onSendTestNotification={onSendTestNotification}
      recentLogs={recentLogs}
    />
  );
};
