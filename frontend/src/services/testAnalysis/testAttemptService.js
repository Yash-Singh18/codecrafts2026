import { supabase } from '../supabase/supabaseClient';

export const testAttemptService = {
  async saveAttempt({ userId, config, questions, answers, analysis, report }) {
    const { error } = await supabase.from('test_attempts').insert({
      user_id: userId,
      topics: config.topics,
      difficulty: config.difficulty,
      num_questions: config.num_questions,
      question_type: config.type,
      questions,
      answers,
      analysis,
      report: report || null,
      score: analysis.overall.score,
      total_time: analysis.overall.total_time,
    });
    if (error) throw error;
  },
};
