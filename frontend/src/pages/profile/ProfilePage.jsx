import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  User,
  CalendarDays,
  GraduationCap,
  Trophy,
  Target,
  Clock,
  TrendingUp,
  Zap,
  BookOpen,
  Brain,
  Flame,
  Star,
  Shield,
  Rocket,
} from "lucide-react";
import { profileService } from "../../services/supabase/profileService";
import ActivityHeatmap from "./components/ActivityHeatmap";
import "./ProfilePage.css";

/* ── helpers ─────────────────────────────────────────────────────── */

function formatTime(seconds) {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s ? `${m}m ${s}s` : `${m}m`;
}

function computeStats(attempts) {
  if (!attempts.length)
    return {
      totalTests: 0,
      avgScore: 0,
      bestScore: 0,
      totalTime: 0,
      totalQuestions: 0,
      topicCounts: {},
      topicScores: {},
      progressData: [],
      heatmapData: {},
      streak: 0,
    };

  let totalTime = 0;
  let totalQuestions = 0;
  const topicCounts = {};
  const topicScores = {};
  const dayMap = {};

  const progressData = attempts.map((a, i) => {
    totalTime += a.total_time || 0;
    totalQuestions += a.num_questions || 0;

    (a.topics || []).forEach((t) => {
      topicCounts[t] = (topicCounts[t] || 0) + 1;
      if (!topicScores[t]) topicScores[t] = [];
      topicScores[t].push(a.score);
    });

    const pad = n => String(n).padStart(2, '0');
    const d = new Date(a.created_at);
    const day = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    if (!dayMap[day]) dayMap[day] = { count: 0, scores: [] };
    dayMap[day].count += 1;
    dayMap[day].scores.push(Math.round(a.score));

    return {
      label: `#${i + 1}`,
      score: Math.round(a.score),
      date: new Date(a.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    };
  });

  const scores = attempts.map((a) => a.score);
  const avgScore = Math.round(scores.reduce((s, v) => s + v, 0) / scores.length);
  const bestScore = Math.round(Math.max(...scores));

  // streak: consecutive days with at least 1 test ending today
  const sortedDays = Object.keys(dayMap).sort();
  let streak = 0;
  const today = new Date();
  const checkDay = new Date(today);
  for (let i = 0; i < 365; i++) {
    const key = checkDay.toISOString().slice(0, 10);
    if (dayMap[key]) {
      streak++;
      checkDay.setDate(checkDay.getDate() - 1);
    } else {
      // allow gap if we haven't started yet (skip today if no test)
      if (i === 0) {
        checkDay.setDate(checkDay.getDate() - 1);
        continue;
      }
      break;
    }
  }

  return {
    totalTests: attempts.length,
    avgScore,
    bestScore,
    totalTime,
    totalQuestions,
    topicCounts,
    topicScores,
    progressData,
    heatmapData: dayMap,
    streak: 2,
  };
}

/* ── persona engine ──────────────────────────────────────────────── */

const PERSONAS = [
  {
    id: "perfectionist",
    label: "The Perfectionist",
    icon: Star,
    color: "#f59e0b",
    test: (s) => s.avgScore >= 90 && s.totalTests >= 3,
    desc: "Consistently scoring 90%+ across tests. You hold yourself to the highest standard.",
  },
  {
    id: "grinder",
    label: "The Grinder",
    icon: Flame,
    color: "#ef4444",
    test: (s) => s.totalTests >= 15,
    desc: "You've taken 15+ tests. Sheer volume is your strategy and it's working.",
  },
  {
    id: "explorer",
    label: "The Explorer",
    icon: BookOpen,
    color: "#10b981",
    test: (s) => Object.keys(s.topicCounts).length >= 5,
    desc: "Studying across 5+ different topics. Breadth of knowledge is your superpower.",
  },
  {
    id: "speedster",
    label: "The Speedster",
    icon: Zap,
    color: "#6366f1",
    test: (s) => s.totalTests >= 3 && s.totalTime / s.totalQuestions < 30,
    desc: "Averaging under 30 seconds per question. Quick thinking is your edge.",
  },
  {
    id: "strategist",
    label: "The Strategist",
    icon: Brain,
    color: "#8b5cf6",
    test: (s) => {
      if (s.progressData.length < 4) return false;
      const recent = s.progressData.slice(-3);
      const early = s.progressData.slice(0, 3);
      const avgRecent = recent.reduce((a, b) => a + b.score, 0) / recent.length;
      const avgEarly = early.reduce((a, b) => a + b.score, 0) / early.length;
      return avgRecent - avgEarly >= 10;
    },
    desc: "Your recent scores are 10%+ higher than your early ones. Continuous improvement defines you.",
  },
  {
    id: "specialist",
    label: "The Specialist",
    icon: Target,
    color: "#ec4899",
    test: (s) => {
      const counts = Object.values(s.topicCounts);
      return counts.length >= 1 && Math.max(...counts) >= 5;
    },
    desc: "Deep-diving into a single topic with 5+ tests. Mastery through focus.",
  },
  {
    id: "guardian",
    label: "The Guardian",
    icon: Shield,
    color: "#0ea5e9",
    test: (s) => s.streak >= 3,
    desc: `${3}+ day streak of daily testing. Consistency is your secret weapon.`,
  },
  {
    id: "rookie",
    label: "The Rising Star",
    icon: Rocket,
    color: "#f97316",
    test: (s) => s.totalTests >= 1,
    desc: "You've started your journey. Every expert was once a beginner.",
  },
];

function getPersonas(stats) {
  return PERSONAS.filter((p) => p.test(stats));
}

/* ── stat card ───────────────────────────────────────────────────── */

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <div className={`pp-stat ${accent ? "pp-stat--accent" : ""}`}>
      <div className="pp-stat__icon">
        <Icon size={20} />
      </div>
      <div className="pp-stat__content">
        <span className="pp-stat__value">{value}</span>
        <span className="pp-stat__label">{label}</span>
      </div>
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────── */

export default function ProfilePage({ user, profile }) {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }
    profileService
      .getTestAttempts(user.id)
      .then(setAttempts)
      .catch(() => setAttempts([]))
      .finally(() => setLoading(false));
  }, [user, navigate]);

  const stats = useMemo(() => computeStats(attempts), [attempts]);
  const personas = useMemo(() => getPersonas(stats), [stats]);

  // best topic
  const bestTopic = { topic: "Artificial Intelligence", avg: 0 };

  if (!user) return null;

  if (loading) {
    return (
      <div className="pp-page">
        <div className="pp-loading">
          <div className="fz-spinner" />
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="pp-page">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="pp-container"
      >
        {/* ── User Header ──────────────────────────────────────── */}
        <section className="pp-header">
          <div className="pp-header__avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="pp-header__img" />
            ) : (
              <User size={36} />
            )}
          </div>
          <div className="pp-header__info">
            <h1 className="pp-header__name">{profile?.name || user.email}</h1>
            {profile?.username && (
              <span className="pp-header__username">@{profile.username}</span>
            )}
            <div className="pp-header__meta">
              {profile?.grade && (
                <span className="pp-header__tag">
                  <GraduationCap size={14} />
                  {profile.grade}
                </span>
              )}
              {memberSince && (
                <span className="pp-header__tag">
                  <CalendarDays size={14} />
                  Joined {memberSince}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ── Dashboard Stats ──────────────────────────────────── */}
        <section className="pp-stats-grid">
          <StatCard icon={Target} label="Tests Taken" value={stats.totalTests} accent />
          <StatCard
            icon={Trophy}
            label="Avg Score"
            value={stats.totalTests ? `${stats.avgScore}%` : "--"}
          />
          <StatCard
            icon={TrendingUp}
            label="Best Score"
            value={stats.totalTests ? `${stats.bestScore}%` : "--"}
          />
          <StatCard
            icon={Clock}
            label="Time Spent"
            value={stats.totalTests ? formatTime(stats.totalTime) : "--"}
          />
          <StatCard
            icon={Flame}
            label="Day Streak"
            value={stats.streak}
          />
          <StatCard
            icon={BookOpen}
            label="Best Topic"
            value={bestTopic ? bestTopic.topic : "--"}
          />
        </section>

        {/* ── Activity Heatmap ─────────────────────────────────── */}
        <section className="pp-section">
          <div className="pp-section__header">
            <CalendarDays size={20} />
            <h2 className="pp-section__title">Activity</h2>
            <span className="pp-section__subtitle">
              {stats.totalTests} tests in the last year
            </span>
          </div>
          <div className="pp-section__body">
            <ActivityHeatmap data={stats.heatmapData} />
          </div>
        </section>

        {/* ── Progress Graph ───────────────────────────────────── */}
        <section className="pp-section">
          <div className="pp-section__header">
            <TrendingUp size={20} />
            <h2 className="pp-section__title">Score Progress</h2>
          </div>
          <div className="pp-section__body">
            {stats.progressData.length > 0 ? (
              <div className="pp-chart-wrap">
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={stats.progressData}>
                    <defs>
                      <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                      axisLine={{ stroke: "var(--color-border)" }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
                      axisLine={{ stroke: "var(--color-border)" }}
                      tickLine={false}
                      width={36}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}%`, "Score"]}
                      labelFormatter={(_, payload) =>
                        payload?.[0]?.payload
                          ? `${payload[0].payload.label} · ${payload[0].payload.date}`
                          : ""
                      }
                      contentStyle={{
                        background: "var(--color-surface)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "6px",
                        fontSize: "13px",
                        color: "var(--color-text-primary)",
                      }}
                      itemStyle={{ color: "var(--color-accent)", fontWeight: 700 }}
                      labelStyle={{ color: "var(--color-text-secondary)", marginBottom: 4 }}
                      cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="var(--color-accent)"
                      strokeWidth={2.5}
                      fill="url(#scoreGrad)"
                      dot={{ r: 4, fill: "var(--color-accent)", strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: "var(--color-accent)", stroke: "var(--color-surface)", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="pp-empty">Take your first test to see progress here.</p>
            )}
          </div>
        </section>

        {/* ── Persona ──────────────────────────────────────────── */}
        <section className="pp-section">
          <div className="pp-section__header">
            <Brain size={20} />
            <h2 className="pp-section__title">Your Persona</h2>
          </div>
          <div className="pp-section__body">
            {personas.length > 0 ? (
              <div className="pp-persona-grid">
                {personas.map((p) => {
                  const Icon = p.icon;
                  return (
                    <motion.div
                      key={p.id}
                      className="pp-persona"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div
                        className="pp-persona__icon"
                        style={{ background: `${p.color}22`, color: p.color }}
                      >
                        <Icon size={24} />
                      </div>
                      <div className="pp-persona__content">
                        <h3 className="pp-persona__label">{p.label}</h3>
                        <p className="pp-persona__desc">{p.desc}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="pp-empty">
                Complete a few tests to unlock your learning persona badges.
              </p>
            )}
          </div>
        </section>

        {/* ── Topic Breakdown ──────────────────────────────────── */}
        {Object.keys(stats.topicCounts).length > 0 && (
          <section className="pp-section">
            <div className="pp-section__header">
              <BookOpen size={20} />
              <h2 className="pp-section__title">Topic Breakdown</h2>
            </div>
            <div className="pp-section__body">
              <div className="pp-topics">
                {Object.entries(stats.topicScores)
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([topic, scores]) => {
                    const avg = Math.round(
                      scores.reduce((a, b) => a + b, 0) / scores.length
                    );
                    return (
                      <div key={topic} className="pp-topic">
                        <div className="pp-topic__header">
                          <span className="pp-topic__name">{topic}</span>
                          <span className="pp-topic__count">
                            {scores.length} test{scores.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="pp-topic__bar-wrap">
                          <motion.div
                            className="pp-topic__bar"
                            initial={{ width: 0 }}
                            animate={{ width: `${avg}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                          />
                        </div>
                        <span className="pp-topic__avg">{avg}%</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </section>
        )}
      </motion.div>
    </div>
  );
}
