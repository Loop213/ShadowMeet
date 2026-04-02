import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Globe2,
  HeartHandshake,
  LockKeyhole,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  Video,
  WandSparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import ThemeToggle from "../components/common/ThemeToggle";
import { useAuthStore } from "../store/useAuthStore";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Features", href: "#features" },
  { label: "Safety", href: "#safety" },
  { label: "Login", href: "/auth", isRoute: true },
];

const featureCards = [
  {
    icon: MessageCircleHeart,
    title: "Private Chat",
    description: "One-to-one anonymous messaging designed to feel intimate, clean, and effortless.",
  },
  {
    icon: Video,
    title: "Video Calling",
    description: "Go from spark to face-to-face in seconds with premium full-screen video rooms.",
  },
  {
    icon: LockKeyhole,
    title: "Privacy First",
    description: "Anonymous identity by default with admin-only access to sensitive account details.",
  },
  {
    icon: Globe2,
    title: "Global Matching",
    description: "Match with people across countries, moods, and shared interests in real time.",
  },
];

const trustItems = [
  { title: "10,000+ users online", copy: "Always-active global queue" },
  { title: "Safe & private chats", copy: "Built-in report, block, and moderation tools" },
  { title: "Fast video matching", copy: "Smooth reconnects and immersive full-screen chat" },
];

const steps = [
  { title: "Click Start Chat", copy: "Jump in instantly from the homepage with one focused CTA." },
  { title: "Get matched instantly", copy: "We connect you to someone new based on live availability and preferences." },
  { title: "Chat or video call", copy: "Move naturally from messages to a private face-to-face connection." },
];

const testimonials = [
  {
    name: "VelvetFox9921",
    role: "Late-night chatter",
    quote: "It feels premium, calm, and way more intentional than random chat apps I’ve tried before.",
  },
  {
    name: "SkylineOtter",
    role: "Remote creative",
    quote: "The homepage actually makes me want to click. The whole experience feels modern and trustworthy.",
  },
  {
    name: "NightWolf241",
    role: "Anonymous user",
    quote: "I like that it feels exciting without exposing too much. Private, stylish, and easy to use.",
  },
];

const floatingBadges = [
  { label: "Live match", className: "left-[7%] top-[18%]" },
  { label: "Safe mode", className: "right-[11%] top-[21%]" },
  { label: "Video spark", className: "left-[18%] bottom-[18%]" },
];

function SectionHeading({ eyebrow, title, copy }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs uppercase tracking-[0.35em] text-pink-300">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl">{title}</h2>
      {copy ? <p className="mt-4 text-base leading-7 text-slate-400">{copy}</p> : null}
    </div>
  );
}

function HomePage() {
  const token = useAuthStore((state) => state.token);
  const [typedHeadline, setTypedHeadline] = useState("");
  const [liveCount, setLiveCount] = useState(12543);

  const targetHeadline = useMemo(() => "Meet New People Instantly ❤️", []);

  useEffect(() => {
    let currentIndex = 0;
    const typingTimer = window.setInterval(() => {
      currentIndex += 1;
      setTypedHeadline(targetHeadline.slice(0, currentIndex));
      if (currentIndex >= targetHeadline.length) {
        window.clearInterval(typingTimer);
      }
    }, 40);

    return () => window.clearInterval(typingTimer);
  }, [targetHeadline]);

  useEffect(() => {
    const statsTimer = window.setInterval(() => {
      setLiveCount((current) => current + (Math.random() > 0.5 ? 3 : -2));
    }, 2200);

    return () => window.clearInterval(statsTimer);
  }, []);

  return (
    <div className="homepage-shell min-h-screen px-4 py-4 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="glass-panel sticky top-4 z-40 rounded-[1.75rem] px-5 py-4 backdrop-blur-2xl">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="shadow-pulse rounded-2xl bg-pink-500/15 p-3 text-pink-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-pink-300">ShadowMeet</p>
                <p className="text-sm text-slate-400">Modern anonymous dating</p>
              </div>
            </div>

            <div className="hidden items-center gap-3 md:flex">
              {navItems.map((item) =>
                item.isRoute ? (
                  <Link key={item.label} to={item.href} className="rounded-full px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                    {item.label}
                  </Link>
                ) : (
                  <a key={item.label} href={item.href} className="rounded-full px-4 py-2 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white">
                    {item.label}
                  </a>
                )
              )}
              <ThemeToggle />
              <Link
                to={token ? "/chat" : "/auth"}
                className="cta-glow inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 px-5 py-2.5 text-sm font-semibold text-white"
              >
                Start Chat
              </Link>
            </div>

            <div className="flex items-center gap-3 md:hidden">
              <ThemeToggle />
              <Link
                to={token ? "/chat" : "/auth"}
                className="cta-glow inline-flex items-center justify-center rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white"
              >
                Start
              </Link>
            </div>
          </div>
        </header>

        <section id="home" className="hero-panel glass-panel relative overflow-hidden rounded-[2.5rem] px-6 py-10 lg:px-10 lg:py-12">
          <div className="pointer-events-none absolute inset-0">
            <div className="hero-blur hero-blur-one" />
            <div className="hero-blur hero-blur-two" />
            <div className="hero-blur hero-blur-three" />
            <div className="hero-grid" />
            {floatingBadges.map((badge, index) => (
              <motion.div
                key={badge.label}
                className={`absolute ${badge.className} hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.25em] text-pink-200 backdrop-blur-md md:block`}
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4 + index, repeat: Infinity }}
              >
                {badge.label}
              </motion.div>
            ))}
          </div>

          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-pink-400/20 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.3em] text-pink-300">
                <HeartHandshake className="h-4 w-4" />
                Trusted by people looking for real conversation
              </div>

              <h1 className="mt-6 max-w-3xl text-5xl font-bold leading-[1.02] text-white sm:text-6xl">
                {typedHeadline}
                <span className="typing-caret">|</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300">
                Anonymous chat, video calls, and real connections in one premium space. Meet someone
                new, stay private, and move from curiosity to chemistry without the noise.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to={token ? "/chat" : "/auth"}
                  className="cta-glow inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 px-6 py-4 font-semibold text-white transition hover:scale-[1.02]"
                >
                  Start Chat Now 🚀
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-6 py-4 font-semibold text-slate-100"
                >
                  Explore Features
                </a>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {trustItems.map((item) => (
                  <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-black/20 px-4 py-4">
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="mt-2 text-sm text-slate-400">{item.copy}</p>
                  </div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              className="relative"
            >
              <div className="premium-card relative overflow-hidden rounded-[2.25rem] p-0">
                <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-pink-500/20 via-fuchsia-500/10 to-orange-400/10 blur-3xl" />
                <div className="relative grid gap-4 p-5">
                  <div className="flex items-center justify-between rounded-[1.5rem] border border-white/10 bg-slate-950/70 px-4 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-pink-300">Live now</p>
                      <p className="mt-2 text-3xl font-bold text-white">{liveCount.toLocaleString()}+</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-500/15 px-4 py-3 text-sm text-emerald-300">
                      Safe & verified flow
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="video-frame relative min-h-[22rem] overflow-hidden rounded-[1.85rem] border border-white/10 bg-black">
                      <div className="absolute inset-0 bg-gradient-to-br from-pink-500/15 via-transparent to-fuchsia-500/10" />
                      <div className="absolute inset-0 grid place-items-center">
                        <div className="text-center">
                          <div className="pulse-ring mx-auto h-24 w-24 rounded-full border border-pink-400/30" />
                          <p className="mt-4 text-lg font-semibold text-white">Private video chat</p>
                          <p className="mt-2 px-6 text-sm text-slate-300">
                            Modern, immersive full-screen calls designed for one meaningful connection at a time.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-orange-300">Fast match</p>
                        <p className="mt-2 text-xl font-semibold text-white">Average connect time: 2 sec</p>
                        <p className="mt-2 text-sm text-slate-400">Low-friction matching that keeps people engaged.</p>
                      </div>
                      <div className="rounded-[1.5rem] border border-white/10 bg-slate-950/70 p-4">
                        <p className="text-xs uppercase tracking-[0.3em] text-teal-300">Anonymous by default</p>
                        <p className="mt-2 text-xl font-semibold text-white">Your identity stays protected</p>
                        <p className="mt-2 text-sm text-slate-400">Trust-building design with privacy-first messaging throughout.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] px-6 py-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-pink-300">Users online</p>
              <p className="mt-2 text-3xl font-bold text-white">{liveCount.toLocaleString()}+</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-pink-300">Privacy score</p>
              <p className="mt-2 text-3xl font-bold text-white">100%</p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-pink-300">Video-ready sessions</p>
              <p className="mt-2 text-3xl font-bold text-white">24/7</p>
            </div>
          </div>
        </section>

        <section id="features" className="space-y-6">
          <SectionHeading
            eyebrow="Features"
            title="Everything you need for a premium anonymous dating experience"
            copy="Clear benefits, cleaner hierarchy, and a modern UI that makes the value obvious at a glance."
          />
          <div className="grid gap-4 lg:grid-cols-4">
            {featureCards.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.article
                  key={feature.title}
                  whileHover={{ y: -6 }}
                  className="glass-panel rounded-[2rem] p-6"
                >
                  <div className="inline-flex rounded-2xl bg-gradient-to-br from-pink-500/20 to-fuchsia-500/20 p-4 text-pink-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{feature.description}</p>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="glass-panel rounded-[2rem] px-6 py-8">
          <SectionHeading
            eyebrow="How It Works"
            title="From click to connection in three simple steps"
            copy="A frictionless experience is what makes people stay. This flow keeps everything focused and fast."
          />
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="relative rounded-[2rem] border border-white/10 bg-white/5 p-6">
                <div className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-fuchsia-500 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">{step.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <SectionHeading
            eyebrow="Testimonials"
            title="Real reactions from people who clicked out of curiosity"
            copy="Short, credible, emotionally grounded reviews help the page feel trustworthy instead of salesy."
          />
          <div className="grid gap-4 lg:grid-cols-3">
            {testimonials.map((item) => (
              <blockquote key={item.name} className="glass-panel rounded-[2rem] p-6">
                <p className="text-base leading-7 text-slate-200">“{item.quote}”</p>
                <footer className="mt-5">
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-sm text-slate-400">{item.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section id="safety" className="glass-panel rounded-[2rem] px-6 py-8">
          <SectionHeading
            eyebrow="Safety"
            title="Designed to feel exciting without sacrificing trust"
            copy="Privacy-first by default with clear moderation tools and platform protections built in."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <ShieldCheck className="h-6 w-6 text-pink-300" />
              <h3 className="mt-4 text-lg font-semibold text-white">Identity stays hidden</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Only admins can see sensitive user details behind the scenes.</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <MessageCircleHeart className="h-6 w-6 text-pink-300" />
              <h3 className="mt-4 text-lg font-semibold text-white">Report and block instantly</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">You stay in control with one-tap safety tools inside the conversation.</p>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
              <WandSparkles className="h-6 w-6 text-pink-300" />
              <h3 className="mt-4 text-lg font-semibold text-white">AI moderation support</h3>
              <p className="mt-2 text-sm leading-6 text-slate-400">Detection systems help reduce abuse, spam, and low-quality interactions.</p>
            </div>
          </div>
        </section>

        <section className="glass-panel relative overflow-hidden rounded-[2.5rem] px-6 py-10 text-center">
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-r from-pink-500/15 via-fuchsia-500/10 to-orange-400/10 blur-3xl" />
          <div className="relative">
            <p className="text-xs uppercase tracking-[0.35em] text-pink-300">Final CTA</p>
            <h2 className="mt-4 text-4xl font-bold text-white sm:text-5xl">Someone is waiting for you…</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Step into a cleaner, safer, more emotionally engaging chat experience designed to convert curiosity into connection.
            </p>
            <Link
              to={token ? "/chat" : "/auth"}
              className="cta-glow mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-pink-500 via-fuchsia-500 to-rose-500 px-7 py-4 font-semibold text-white"
            >
              Start Chat Now ❤️
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <footer className="glass-panel rounded-[2rem] px-6 py-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">ShadowMeet</p>
              <p className="mt-1 text-sm text-slate-400">Premium anonymous dating and video chat.</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <a href="#home" className="transition hover:text-white">Privacy Policy</a>
              <a href="#features" className="transition hover:text-white">Terms</a>
              <a href="#safety" className="transition hover:text-white">Contact</a>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-pink-300">Instagram</span>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-pink-300">X</span>
            </div>
          </div>
        </footer>

        <div className="sticky bottom-4 z-30 px-1 md:hidden">
          <Link
            to={token ? "/chat" : "/auth"}
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
