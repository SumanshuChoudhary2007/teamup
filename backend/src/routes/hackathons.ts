import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Get all hackathons
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('hackathons')
      .select('*')
      .order('date', { ascending: true });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new hackathon
router.post('/', async (req, res) => {
  try {
    const { title, description, date, end_date, mode, location, prize, organizer, website_url, tags, created_by } = req.body;
    
    const { data, error } = await supabase
      .from('hackathons')
      .insert([{ title, description, date, end_date, mode, location, prize, organizer, website_url, tags, created_by }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
