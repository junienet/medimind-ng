import { Medication } from './medication.model';
import { DoctorRef } from './patient.model';

export interface Prescription {
  _id: string;
  medicationId?: Medication;
  doctorId?: DoctorRef;
  patientId?: string;
  start_date?: string;
  end_date?: string;
  notes?: string;
  reminder_times?: string[];
  status?: string;
}
