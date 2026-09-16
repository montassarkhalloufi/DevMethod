export interface Workshop extends Record<string, unknown> {
  id: string;
  category: string;
  title: string;
  date: string;
  time: string;
  location: string;
  capacity: number;
}

export interface Registration extends Record<string, unknown> {
  id: string;
  workshopId: string;
  name: string;
}

export interface WorkshopData extends Record<string, unknown> {
  workshops: Workshop[];
  registrations: Registration[];
  waitlist: Registration[];
}

export interface Snapshot {
  version: number;
  data: WorkshopData;
}

export type BookingIntent =
  | { type: 'register'; workshopId: string; name: string; id: string }
  | { type: 'cancel'; registrationId: string }
  | { type: 'leave-waitlist'; registrationId: string };

export type Drafts = Record<string, string>;
