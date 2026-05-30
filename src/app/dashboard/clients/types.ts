export type ClientType = 'Detal' | 'Mayorista';

export interface Client {
  id: string;
  name: string;
  clientType: ClientType;
  phone: string | null;
  address: string | null;
  city: string | null;
  email: string | null;
}

export interface ClientFormData {
  name: string;
  clientType: ClientType;
  phone: string;
  address: string;
  city: string;
  email: string;
}
