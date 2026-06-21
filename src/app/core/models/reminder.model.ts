import { Prescription } from './prescription.model';

export interface Reminder {
  _id: string;
  prescriptionId?: Prescription | string;
  reminder_time?: string;
  scheduled_time?: string;
  taken_time?: string;
  completed_today?: boolean;
  status?: 'Completed' | 'Active' | 'Ignored';
}
