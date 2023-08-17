type Booking = {
  type: string;
  id: number;
  date_arrival: string;
  date_departure: string;
  date_created: string;
  property_id: number;
  property_name: string;
  property_internal_name: string;
  property_image_url: string;
  status: string;
  room_types: {
    id: number;
    room_type_id: number;
    image_url: string | null;
    name: string;
    people: number;
  }[];
  add_ons: any[]; // You can specify more detailed type if available
  currency_code: string;
  source: string;
  source_text: string;
  notes: string | null;
  language: string;
  ip_address: string;
  ip_country: string;
  is_policy_active: boolean;
  external_url: string | null;
  nights: number;
  promotion_code: string | null;
};

type Guest = {
  uid: string;
  name: string;
  email: string;
  phone_number: string;
  country: string | null;
  country_code: string | null;
};

type Transaction = {
  amount: string;
};

type LodgifyBookingWebhookObject = {
  action: string;
  booking: Booking;
  guest: Guest;
  current_order: any | null; // You can specify more detailed type if available
  subowner: any | null; // You can specify more detailed type if available
  booking_total_amount: string;
  booking_currency_code: string;
  total_transactions: Transaction;
  balance_due: string;
};

type LodgifyBookingWebhookObjectBody = LodgifyBookingWebhookObject[]