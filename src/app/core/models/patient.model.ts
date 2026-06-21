import { User } from './user.model';

export interface DoctorRef {
  _id: string;
  userId?: User;
}

export interface Patient {
  _id: string;
  userId?: User;
  doctorId?: DoctorRef;
  isMyPatient?: boolean;
}
