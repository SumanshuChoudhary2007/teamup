import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AdminRequest {
  id: string;
  user_id: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  user?: Profile;
}

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'team_leader' | 'admin';
  skills: string[];
  experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  portfolio_link: string | null;
  avatar_url: string | null;
  bio: string | null;
  github_url: string | null;
  linkedin_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Hackathon = {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  end_date: string | null;
  registration_deadline: string | null;
  mode: 'online' | 'offline' | 'hybrid';
  location: string | null;
  prize: string | null;
  banner_url: string | null;
  website_url: string | null;
  organizer: string | null;
  tags: string[];
  created_by: string | null;
  created_at: string;
};

export type Team = {
  id: string;
  hackathon_id: string;
  team_name: string;
  project_idea: string | null;
  description: string | null;
  required_skills: string[];
  current_members: number;
  max_members: number;
  status: 'OPEN' | 'FULL';
  created_by: string;
  created_at: string;
  updated_at: string;
  hackathon?: Hackathon;
  leader?: Profile;
};

export type Application = {
  id: string;
  user_id: string;
  team_id: string;
  message: string | null;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
  user?: Profile;
  team?: Team;
};

export type Notification = {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};

export type Message = {
  id: string;
  team_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: Profile;
};
