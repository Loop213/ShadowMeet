import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Globe2,
  Heart,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/common/ThemeToggle";
import { useAuthStore } from "../store/useAuthStore";

const featureCards = [
  {
    icon: MessageCircleHeart,
    emoji: "💬",
    title: "Private Chat",
    description: "Chat anonymously with anyone in the world in a smooth, distraction-free space.",
  },
  {
    icon: Video,
    emoji: "🎥",
    title: "Video Call",
    description: "Go face-to-face instantly when the vibe is right and the connection feels real.",
  },
  {
    icon: ShieldCheck,
    emoji: "🔒",
    title: "100% Privacy",
    description: "Your public identity stays hidden while powerful safety tools protect the experience.",
  },
  {
    icon: Globe2,
    emoji: "🌍",
    title: "Global Matching",
    description: "Meet people across countries, interests, and late-night moods in seconds.",
  },
];

const testimonials = [
  {
    name: "VelvetFox9921",
    quote: "It feels way more premium than random chat apps. I joined for fun and stayed for the energy.",
  },
  {
    name: "NightWolf241",
    quote: "The anonymous-first flow removes pressure. It feels exciting without being chaotic.",
  },
  {
    name: "SkylineOtter",
    quote: "Video, chat, and the visual design all feel polished. It actually feels modern.",
  },
];

const activities = [
  "Someone from India just joined",
  "A new video match started in London",
  "Someone from Brazil clicked Start Chat",
  "Two strangers just matched over music",
  "A guest user from Dubai entered the queue",
];

const floatingIcons = [
  { Icon: Heart, className: "left-[8%] top-[18%]", delay: 0.1 },
  { Icon: MessageCircleHeart, className: "left-[76%] top-[20%]", delay: 0.5 },
  { Icon: Sparkles, className: "left-[18%] top-[66%]", delay: 0.8 },
  { Icon: Heart, className: "left-[84%] top-[66%]", delay: 0.3 },
];

const stats = [
  { label: "Users online now", value: "10,000+" },
  { label: "Average match time", value: "2 sec" },
  { label: "Anonymous chats started", value: "1.8M+" },
];

const headlineWords = ["Meet Strangers.", "Make Connections.", "Feel the Spark ❤️"];

function HomePage() {
  const token = useAuthStore((state) => state.token);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [typedHeadline, setTypedHeadline] = useState("");

  const targetHeadline = useMemo(() => headlineWords.join(" "), []);

  useEffect(() => {
    const tickerTimer = window.setInterval(() => {
      setTickerIndex((current) => (current + 1) % activities.length);
    }, 2600);

    return () => window.clearInterval(tickerTimer);
  }, []);

  useEffect(() => {
    let currentIndex = 0;
    const typingTimer = window.setInterval(() => {
      currentIndex += 1;
      setTypedHeadline(targetHeadline.slice(0, currentIndex));
      if (currentIndex >= targetHeadline.length) {
        window.clearInterval(typingTimer);
      }
    }, 42);

    return () => window.clearInterval(typingTimer);
  }, [targetHeadline]);

  return (
    <div className="homepage-shell min-h-screen px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="glass-panel rounded-[2rem] px-5 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="shadow-pulse rounded-2xl bg-pink-500/15 p-3 text-pink-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-pink-300">ShadowMeet</p>
                <p className="text-sm text-slate-400">Anonymous chemistry, modern connections</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ThemeToggle />
              <Link
                to={token ? "/app" : "/auth"}
                className="shadow-pulse rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 px-5 py-2 text-sm font-semibold text-white"
              >
                {token ? "Open App" : "Start Chat"}
              </Link>
            </div>
          </div>
        </header>

        <section className="hero-panel glass-panel relative overflow-hidden rounded-[2.5rem] px-6 py-8 lg:px-10 lg:py-12">
          <div className="absolute inset-0 pointer-events-none">
            <div className="hero-blur hero-blur-one" />
            <div className="hero-blur hero-blur-two" />
            <div className="hero-blur hero-blur-three" />
            <div className="hero-grid" />
            {floatingIcons.map(({ Icon, className, delay }, index) => (
              <motion.div
                key={index}
                className={`absolute ${className} hidden rounded-full border border-white/10 bg-white/5 p-3 text-pink-200 backdrop-blur-md md:block`}
                animate={{ y: [0, -12, 0], rotate: [0, 6, 0] }}
                transition={{ duration: 4.6, repeat: Infinity, delay }}
              >
                <Icon className="h-5 w-5" />
              </motion.div>
            ))}
          </div>

          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-pink-400/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-pink-300"
              >
                <Globe2 className="h-4 w-4" />
                Thousands are chatting right now. Don’t miss out.
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.08 }}
                className="max-w-3xl text-5xl font-bold leading-[1.02] text-white sm:text-6xl"
              >
                {typedHeadline}
                <span className="typing-caret">|</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.16 }}
                className="mt-6 max-w-2xl text-base leading-7 text-slate-300"
              >
                Anonymous chat, real-time video, and endless possibilities. Step into a more
                cinematic way to meet strangers, flirt safely, and discover who you’ll connect with next.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.24 }}
                className="mt-8 flex flex-col gap-3 sm:flex-row"
              >
                <Link
                  to={token ? "/app" : "/auth"}
                  className="cta-glow inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 px-6 py-4 font-semibold text-white transition hover:scale-[1.02]"
                >
                  Start Chat Now 🚀
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/auth"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-slate-100"
                >
                  Continue as Guest
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.32 }}
                className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300"
              >
                <span className="font-medium text-pink-300">{activities[tickerIndex]}</span>
                <span className="ml-2 text-slate-400">Who will you meet next?</span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="grid gap-4 md:grid-cols-2"
            >
              <div className="premium-card md:col-span-2">
                <p className="text-xs uppercase tracking-[0.3em] text-orange-300">Live spark meter</p>
                <p className="mt-3 text-4xl font-bold text-white">10,000+ users online now</p>
                <p className="mt-2 text-sm text-slate-400">
                  Curiosity, chemistry, and random timing. The room never really sleeps.
                </p>
              </div>

              {stats.slice(1).map((item) => (
                <div key={item.label} className="premium-card">
                  <p className="text-xs uppercase tracking-[0.3em] text-pink-300">{item.label}</p>
                  <p className="mt-3 text-3xl font-bold text-white">{item.value}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <motion.section
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65 }}
          className="grid gap-4 lg:grid-cols-4"
        >
          {featureCards.map((feature) => {
            const Icon = feature.icon;
            return (
              <article key={feature.title} className="glass-panel rounded-[2rem] p-6 transition hover:-translate-y-1">
                <div className="inline-flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-pink-300">
                  <span className="text-xl">{feature.emoji}</span>
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-xl font-semibold text-white">{feature.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{feature.description}</p>
              </article>
            );
          })}
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="glass-panel rounded-[2rem] px-6 py-8"
        >
          <div className="mb-6">
            <p className="text-xs uppercase tracking-[0.3em] text-orange-300">Testimonials</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">People come for curiosity, stay for the spark</h2>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {testimonials.map((item) => (
              <blockquote
                key={item.name}
                className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-md"
              >
                <p className="text-base leading-7 text-slate-200">“{item.quote}”</p>
                <footer className="mt-5 text-sm text-slate-400">{item.name}</footer>
              </blockquote>
            ))}
          </div>
        </motion.section>

        <div className="sticky bottom-4 z-30 px-1 md:hidden">
          <Link
            to={token ? "/app" : "/auth"}
            className="cta-glow flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 px-6 py-4 text-base font-semibold text-white"
          >
            Start Chat Now 🚀
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
