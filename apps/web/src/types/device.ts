export interface Device {
    device_id: string;
    device_name: string;
    device_type: 'desktop' | 'mobile' | 'tablet' | 'other';
    last_active: string;
    is_current: boolean;
    auto_sync: boolean;
    browser_type?: string;
    created_at: string;
    device_settings: Record<string, any>;
    device_token: string;
    is_active: boolean;
    last_ip_address: string;
    os_type: string;
    sync_enabled: boolean;
    sync_interval: number;
    updated_at: string;
    user_id: string;
    is_connected: boolean;
  }