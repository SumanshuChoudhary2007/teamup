import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || ''; // Ideally use SERVICE_ROLE key, but anon works for API
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(cors());
app.use(express.json());

// Auth Middleware
const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Missing token' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  // Attach user and profile
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  (req as any).user = user;
  (req as any).profile = profile;
  next();
};

// ==========================================
// AUTH & USERS
// ==========================================
app.get('/api/profile', authenticate, async (req, res) => {
  res.json((req as any).profile);
});

app.patch('/api/profile', authenticate, async (req, res) => {
  const { name, skills, experience, portfolio_link, bio, github_url, linkedin_url } = req.body;
  const userId = (req as any).user.id;

  const { data, error } = await supabase
    .from('profiles')
    .update({ name, skills, experience, portfolio_link, bio, github_url, linkedin_url })
    .eq('id', userId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ==========================================
// HACKATHONS
// ==========================================
app.get('/api/hackathons', async (req, res) => {
  const { data, error } = await supabase.from('hackathons').select('*').order('date', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/hackathons', authenticate, async (req, res) => {
  const profile = (req as any).profile;
  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { title, description, date, mode } = req.body;
  const { data, error } = await supabase
    .from('hackathons')
    .insert([{ title, description, date, mode, created_by: profile.id }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// ==========================================
// TEAMS
// ==========================================
app.post('/api/teams', authenticate, async (req, res) => {
  const profile = (req as any).profile;
  if (profile.role !== 'team_leader' && profile.role !== 'admin' && profile.role !== 'super_admin') {
    return res.status(403).json({ error: 'Team Leaders only' });
  }

  const { hackathon_id, team_name, project_idea, required_skills, max_members, current_members } = req.body;
  const { data, error } = await supabase
    .from('teams')
    .insert([{ 
      hackathon_id, team_name, project_idea, required_skills, 
      max_members, 
      current_members: current_members || 1, 
      status: (current_members || 1) >= max_members ? 'FULL' : 'OPEN',
      created_by: profile.id 
    }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.get('/api/teams', async (req, res) => {
  const hackathon_id = req.query.hackathon_id;
  let query = supabase.from('teams').select('*, hackathon:hackathons(title), leader:profiles!teams_created_by_fkey(*)');
  if (hackathon_id) query = query.eq('hackathon_id', hackathon_id);
  // Hide full teams per requirement
  query = query.eq('status', 'OPEN');

  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/api/team/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('teams')
    .select('*, hackathon:hackathons(*), leader:profiles!teams_created_by_fkey(*)')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ==========================================
// APPLICATIONS
// ==========================================
app.post('/api/apply', authenticate, async (req, res) => {
  const profile = (req as any).profile;
  const { team_id, message } = req.body;

  // Check if team is FULL
  const { data: team } = await supabase.from('teams').select('*').eq('id', team_id).single();
  if (!team || team.status === 'FULL') {
    return res.status(400).json({ error: 'Team is full or does not exist' });
  }

  const { data, error } = await supabase
    .from('applications')
    .insert([{ user_id: profile.id, team_id, message, status: 'pending' }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.get('/api/applications/team/:teamId', authenticate, async (req, res) => {
  const profile = (req as any).profile;
  const teamId = req.params.teamId;

  // Only leader can see
  const { data: team } = await supabase.from('teams').select('created_by').eq('id', teamId).single();
  if (team?.created_by !== profile.id) return res.status(403).json({ error: 'Unauthorized' });

  const { data, error } = await supabase
    .from('applications')
    .select('*, user:profiles!applications_user_id_fkey(*)')
    .eq('team_id', teamId);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch('/api/applications/:id', authenticate, async (req, res) => {
  const profile = (req as any).profile;
  const appId = req.params.id;
  const { status } = req.body; // 'accepted' or 'rejected'

  const { data: application } = await supabase.from('applications').select('*').eq('id', appId).single();
  if (!application) return res.status(404).json({ error: 'Not found' });

  // Verify leader
  const { data: team } = await supabase.from('teams').select('*').eq('id', application.team_id).single();
  if (team?.created_by !== profile.id) return res.status(403).json({ error: 'Unauthorized' });

  // If accepting, check capacity
  if (status === 'accepted') {
    const spots_left = team.max_members - team.current_members;
    if (spots_left <= 0) return res.status(400).json({ error: 'Team is full' });

    // Update team members count
    const newCount = team.current_members + 1;
    const newStatus = newCount >= team.max_members ? 'FULL' : 'OPEN';
    
    await supabase.from('teams').update({ current_members: newCount, status: newStatus }).eq('id', team.id);
  }

  // Update application
  const { data, error } = await supabase
    .from('applications')
    .update({ status })
    .eq('id', appId)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// ==========================================
// ADMIN REQUESTS & APPROVALS
// ==========================================
app.post('/api/admin/request', authenticate, async (req, res) => {
  const profile = (req as any).profile;
  const { reason } = req.body;

  const { data, error } = await supabase
    .from('admin_requests')
    .insert([{ user_id: profile.id, reason, status: 'pending' }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

app.get('/api/admin/requests', authenticate, async (req, res) => {
  const profile = (req as any).profile;
  if (profile.role !== 'admin' && profile.role !== 'super_admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const { data, error } = await supabase
    .from('admin_requests')
    .select('*, user:profiles!admin_requests_user_id_fkey(*)')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.patch('/api/admin/requests/:id', authenticate, async (req, res) => {
  const profile = (req as any).profile;
  if (profile.role !== 'super_admin') {
    return res.status(403).json({ error: 'Only Super Admin can approve new admins' });
  }

  const { status } = req.body; // 'approved' or 'rejected'
  const requestId = req.params.id;

  const { data: request } = await supabase.from('admin_requests').select('*').eq('id', requestId).single();
  if (!request) return res.status(404).json({ error: 'Request not found' });

  // Update request status
  const { error: reqError } = await supabase
    .from('admin_requests')
    .update({ status })
    .eq('id', requestId);

  if (reqError) return res.status(500).json({ error: reqError.message });

  // If approved, update user role to 'admin' (NEVER super_admin)
  if (status === 'approved') {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', request.user_id);
    
    if (profileError) return res.status(500).json({ error: profileError.message });
  }

  res.json({ message: `Request ${status} successfully` });
});

app.listen(port, () => {
  console.log(`Backend API running on port ${port}`);
});
