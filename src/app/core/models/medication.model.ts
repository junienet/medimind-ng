export interface Medication {
  _id: string;
  medication_name: string;
  dosage: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
  description?: string;
}
