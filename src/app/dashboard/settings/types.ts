export interface SystemSettings {
  id: string;
  generalMinStock: number;
  expirationAlertDays: number;
  companyName: string | null;
  notifyStockAlerts: boolean;
  notifyExpirationAlerts: boolean;
  notifyEntryIssueAlerts: boolean;
  updatedAt: string;
}
