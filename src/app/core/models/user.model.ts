export type UserType = 'patient' | 'doctor';

export interface User {
  _id?: string;
  name: string;
  phone_number: string;
  email?: string;
  user_type: UserType;
  [key: string]: unknown;
}
