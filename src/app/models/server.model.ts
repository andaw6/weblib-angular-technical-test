/**
 * Server entity model representing a server in the infrastructure
 */
export interface Server {
  id: number;
  serial: string;
  name: string;
  assetName: string;
  version: string;
  serverType: ServerType;
  license: LicenseType;
  hardware: HardwareType;
  status: ServerStatus;
  warningsCount: number;
  lastCommDate: string; // ISO date string
}

export type ServerStatus = 'Running' | 'Stopped' | 'Maintenance' | 'Error' | 'Pending';
export type ServerType = 'Apache' | 'Nginx' | 'IIS' | 'Node.js' | 'Tomcat' | 'Custom';
export type LicenseType = 'Enterprise' | 'Standard' | 'Community' | 'Trial' | 'Professional';
export type HardwareType = 'Physical' | 'Virtual' | 'Cloud' | 'Container' | 'Hybrid';
export type AssetType = 'Production' | 'Development' | 'Staging' | 'Testing' | 'QA' | 'Integration' | 'Demo' | 'Backup';

export const SERVER_STATUSES: ServerStatus[] = ['Running', 'Stopped', 'Maintenance', 'Error', 'Pending'];
export const SERVER_TYPES: ServerType[] = ['Apache', 'Nginx', 'IIS', 'Node.js', 'Tomcat', 'Custom'];
export const LICENSE_TYPES: LicenseType[] = ['Enterprise', 'Standard', 'Community', 'Trial', 'Professional'];
export const HARDWARE_TYPES: HardwareType[] = ['Physical', 'Virtual', 'Cloud', 'Container', 'Hybrid'];
export const ASSET_TYPES: AssetType[] = ['Production', 'Development', 'Staging', 'Testing', 'QA', 'Integration', 'Demo', 'Backup'];

/**
 * Status color mapping for visual display
 */
export const STATUS_COLORS: Record<ServerStatus, { bg: string; text: string }> = {
  Running: { bg: 'bg-green-500/20', text: 'text-green-400' },
  Stopped: { bg: 'bg-red-500/20', text: 'text-red-400' },
  Maintenance: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  Error: { bg: 'bg-red-500/20', text: 'text-red-400' },
  Pending: { bg: 'bg-yellow-500/20', text: 'text-yellow-400' }
};
