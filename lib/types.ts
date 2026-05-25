// Types DB partagés. On les écrit à la main — pas besoin de générer
// depuis Supabase pour 4 tables. Si la DB grossit, on switchera sur
// `supabase gen types typescript`.

export type Artisan = {
  id: string;
  user_id: string;
  name: string;
  twilio_number: string;   // "whatsapp:+33612345678"
  notify_number: string;   // "whatsapp:+33699999999"
  created_at: string;
};

export type ConversationStatus = "open" | "paused" | "closed";

export type Conversation = {
  id: string;
  artisan_id: string;
  client_number: string;
  client_name: string | null;
  problem_type: string | null;
  urgency: number | null;
  needs_appointment: boolean;
  status: ConversationStatus;
  summary: string | null;
  last_message_at: string;
  last_seen_at: string | null;   // dernière ouverture par l'artisan
  created_at: string;
};

export type MessageRole = "client" | "ai" | "artisan";

export type Message = {
  id: string;
  conversation_id: string;
  role: MessageRole;
  body: string | null;
  media_url: string | null;
  created_at: string;
};

// Sortie structurée renvoyée par Claude (tool_use)
export type Qualification = {
  problem_type: string;
  urgency: 1 | 2 | 3 | 4 | 5;
  needs_appointment: boolean;
  client_name?: string | null;
  summary: string;
  reply_to_client: string;
};
