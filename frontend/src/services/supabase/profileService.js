import { supabase } from './supabaseClient';

export const profileService = {
  async getProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    return data || null;
  },

  async createProfile(userId, { name, username, date_of_birth, grade }) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: userId, name, username, date_of_birth, grade: grade || null })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async isUsernameAvailable(username) {
    const { data } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();
    return !data;
  },

  async getTestAttempts(userId) {
    const { data, error } = await supabase
      .from('test_attempts')
      .select('id, topics, difficulty, num_questions, question_type, score, total_time, analysis, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },
};
