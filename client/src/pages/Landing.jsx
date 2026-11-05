import { Navigate } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Eye,
  FileText,
  FileQuestion,
  Gift,
  HeartPulse,
  History,
  House,
  KeyRound,
  Landmark,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Undo2,
  Users,
  Accessibility,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { AccessibilityBar } from '../components/AccessibilityBar.jsx';
import { Logo } from '../components/Logo.jsx';
import { Avatar, Button, IconChip, Ring } from '../components/ui.jsx';

/* ------------------------------------------------------------------ */
/* Hero product preview — built from real UI pieces, not a screenshot  */
/* ------------------------------------------------------------------ */

const PREVIEW_ITEMS = [
  { icon: Landmark, title: 'SBI Savings Account', to: 'Priya & Arjun' },
  { icon: ShieldCheck, title: 'LIC Jeevan Anand', to: 'Priya' },
  { icon: House, title: 'House — 12, Green Park', to: 'Arjun' },
  { icon: Mail, title: 'Gmail & family photos', to: 'Priya' },
];

function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden>
      <div className="absolute -inset-6 rounded-[2rem] bg-gold/10 blur-2xl" />

      <div className="relative rounded-3xl bg-white p-6 text-ink shadow-[var(--shadow-lift)]">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-gold-dark">Ramesh's plan</p>
            <p className="font-serif text-xl font-semibold text-navy-900">Almost ready</p>
          </div>
          <Ring value={83} size={72} stroke={7} track="#eef0f5" color="#172a5c" label="">
            <span className="text-base font-bold text-navy-900">83%</span>
          </Ring>
        </div>
        <ul className="mt-5 divide-y divide-line">
          {PREVIEW_ITEMS.map(({ icon, title, to }) => (
            <li key={title} className="flex items-center gap-3 py-3">
              <IconChip icon={icon} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold">{title}</p>
                <p className="text-sm text-muted">Goes to {to}</p>
              </div>
              <Lock className="size-4 text-gold-dark" />
            </li>
          ))}
        </ul>
      </div>

      <div className="absolute -right-3 -top-6 hidden rounded-2xl bg-white p-4 shadow-[var(--shadow-lift)] sm:block">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-ok-soft text-ok">
            <HeartPulse className="size-5" />
          </span>
          <div>
            <p className="text-sm text-muted">Next check-in</p>
            <p className="font-bold text-navy-900">in 24 days</p>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-7 -left-4 hidden rounded-2xl bg-white p-4 shadow-[var(--shadow-lift)] sm:block">
        <div className="flex items-center gap-3">
          <Avatar name="Priya Kumar" size="sm" />
          <p className="text-sm">
            <strong>Priya</strong> accepted your invitation
          </p>
          <CheckCircle2 className="size-5 text-ok" />
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

const PROBLEMS = [
  { icon: KeyRound, title: 'Passwords nobody knows', text: 'Bank logins, email and phone passcodes disappear with the person who remembered them.' },
  { icon: FileQuestion, title: 'Papers that cannot be found', text: 'Policies, property deeds and the will are scattered across cupboards, lockers and inboxes.' },
  { icon: Users, title: 'Wishes left unsaid', text: 'Families are left guessing what should happen to each account — at the hardest time of their lives.' },
];

const STEPS = [
  { icon: ClipboardList, title: 'Write it down', text: 'Add your accounts, policies and property, one simple step at a time.' },
  { icon: Users, title: 'Choose your people', text: 'Invite family by email and decide exactly who receives what.' },
  { icon: HeartPulse, title: 'Check in now and then', text: 'Once a month we ask “Are you well?”. One click — or simply logging in — is enough.' },
  { icon: Gift, title: 'A gentle handover', text: 'Only if you stop responding, after many warnings, is each item passed on.' },
];

const TIMELINE = [
  { label: 'Active', text: 'Everything stays private. You check in now and then.', tone: 'bg-ok' },
  { label: 'Reminder', text: 'A friendly email 3 days before your check-in is due.', tone: 'bg-gold' },
  { label: 'Waiting period', text: 'Urgent emails to you; your family is asked to check on you.', tone: 'bg-[#d97706]' },
  { label: 'Handover', text: 'Only now do your chosen people see what you left them.', tone: 'bg-white' },
];

const SAFETY = [
  { icon: Lock, title: 'Encrypted with AES-256', text: 'Every password, letter and file is sealed with a key unique to your vault before it is stored.' },
  { icon: Eye, title: 'Invisible until needed', text: 'Your trusted people see nothing at all while you keep checking in.' },
  { icon: Undo2, title: 'Always reversible', text: 'Checking in at any time locks everything again — even after a handover.' },
  { icon: History, title: 'Every access recorded', text: 'A full activity history shows who opened what, and when.' },
];

const FEATURES = [
  { icon: Landmark, title: 'Accounts & assets', text: 'Bank accounts, insurance, investments, property and devices — with your wishes for each.' },
  { icon: FileText, title: 'Important documents', text: 'Keep encrypted copies of your will, property papers and ID proofs.' },
  { icon: Mail, title: 'Personal letters', text: 'Words of love and guidance, delivered privately to each person.' },
  { icon: Users, title: 'Trusted people', text: 'Invite family by email. They accept with their own secure account.' },
  { icon: BellRing, title: 'Gentle reminders', text: 'Email reminders with a one-click “Yes, I am well” button.' },
  { icon: Accessibility, title: 'Easy to read and use', text: 'Large clear text, three text sizes, read-aloud and plain language throughout.' },
];

const FAQ = [
  {
    q: 'Is this a legal will?',
    a: 'No. It complements your registered will by making sure your family can actually find and use everything. You can store a copy of your will here.',
  },
  {
    q: 'What if I forget to check in?',
    a: 'We remind you by email before the date, then send urgent messages and ask your family to check on you. There is a waiting period you choose (up to 30 days) before anything is shared — and logging in at any point cancels it.',
  },
  {
    q: 'Can my family see my details now?',
    a: 'No. They only see that you have named them. Nothing else is visible unless your plan is handed over.',
  },
  {
    q: 'Can the people running this website read my passwords?',
    a: 'Private details, letters and files are encrypted before they are saved. Viewing them always requires your password again, and every view is recorded.',
  },
  {
    q: 'I am not good with computers. Will I manage?',
    a: 'It was designed for you. Every screen asks one simple question at a time, buttons are large and labelled, and you can make the text bigger or have the page read aloud.',
  },
];

function SectionHeading({ eyebrow, title, intro, light, center = true }) {
  return (
    <div className={`${center ? 'mx-auto text-center' : ''} max-w-2xl`}>
      <p className={`text-sm font-bold uppercase tracking-[0.18em] ${light ? 'text-gold' : 'text-gold-dark'}`}>{eyebrow}</p>
      <h2 className={`mt-3 font-serif text-3xl font-semibold leading-tight sm:text-4xl ${light ? 'text-white' : 'text-navy-900'}`}>
        {title}
      </h2>
      {intro && <p className={`mt-4 text-lg ${light ? 'text-white/75' : 'text-muted'}`}>{intro}</p>}
    </div>
  );
}

export default function Landing() {
  const { user } = useAuth();
  if (user) return <Navigate to="/app" replace />;

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="bg-hero grain relative overflow-hidden text-white">
        <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
          <Logo tone="light" />
          <nav aria-label="Page sections" className="hidden items-center gap-7 text-[0.95rem] font-bold md:flex">
            <a href="#how" className="text-white/75 no-underline hover:text-white">How it works</a>
            <a href="#safety" className="text-white/75 no-underline hover:text-white">Safety</a>
            <a href="#faq" className="text-white/75 no-underline hover:text-white">Questions</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button to="/login" variant="light" size="sm" className="hidden sm:inline-flex">Log in</Button>
            <Button to="/register" variant="gold" size="sm">Get started</Button>
          </div>
        </header>

        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-4 pb-24 pt-10 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:pb-32 lg:pt-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-sm font-bold text-gold">
              <Sparkles className="size-4" aria-hidden /> A digital will for the people you love
            </p>
            <h1 className="mt-6 font-serif text-[2.6rem] font-semibold leading-[1.08] sm:text-6xl">
              Everything your family will need, <span className="text-gold-gradient">kept safe</span> until it matters.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-white/80 sm:text-xl">
              Record your bank accounts, policies, property papers and wishes in one secure place. They are passed to the
              people you choose — only if you stop checking in.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button to="/register" variant="gold" size="lg" icon={ArrowRight}>Create my free plan</Button>
              <Button href="#how" variant="light" size="lg">See how it works</Button>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[0.95rem] text-white/70">
              {['AES-256 encryption', 'Free to use', 'No technical skills needed'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-gold" aria-hidden /> {t}
                </li>
              ))}
            </ul>
          </div>
          <HeroPreview />
        </div>

        <div className="relative hidden justify-center pb-6 md:flex">
          <div className="rounded-2xl">
            <AccessibilityBar tone="light" />
          </div>
        </div>
      </section>

      {/* ---------------- The problem ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <SectionHeading
          eyebrow="Why it matters"
          title="When someone passes away, families often spend months searching."
          intro="A few calm minutes today can spare the people you love a great deal of worry later."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {PROBLEMS.map(({ icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-line bg-white p-7 shadow-[var(--shadow-soft)]">
              <IconChip icon={icon} tone="gold" size="lg" />
              <h3 className="mt-5 font-serif text-xl font-semibold text-navy-900">{title}</h3>
              <p className="mt-2 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- How it works ---------------- */}
      <section id="how" className="scroll-mt-6 border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <SectionHeading eyebrow="How it works" title="Four simple steps. Take them at your own pace." />
          <ol className="relative mt-14 grid gap-10 md:grid-cols-4 md:gap-6">
            <div className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-gradient-to-r from-gold/0 via-gold/60 to-gold/0 md:block" aria-hidden />
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative text-center">
                <span className="relative mx-auto flex size-14 items-center justify-center rounded-2xl bg-navy-900 text-gold shadow-[var(--shadow-lift)]">
                  <Icon className="size-7" aria-hidden />
                  <span className="absolute -right-2 -top-2 flex size-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-navy-950">
                    {i + 1}
                  </span>
                </span>
                <h3 className="mt-5 font-serif text-xl font-semibold text-navy-900">{title}</h3>
                <p className="mx-auto mt-2 max-w-60 text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------- Safety ---------------- */}
      <section id="safety" className="bg-hero grain relative scroll-mt-6 overflow-hidden text-white">
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
          <SectionHeading
            light
            eyebrow="Safety by design"
            title="Nothing is shared by mistake."
            intro="Your plan moves through clear stages, with many warnings along the way. At any point, one check-in puts everything back to private."
          />

          <ol className="mt-14 grid gap-4 md:grid-cols-4">
            {TIMELINE.map((s, i) => (
              <li key={s.label} className="relative rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-center gap-3">
                  <span className={`size-3 rounded-full ${s.tone}`} aria-hidden />
                  <span className="text-sm font-bold uppercase tracking-[0.14em] text-white/60">Stage {i + 1}</span>
                </div>
                <p className="mt-3 font-serif text-xl font-semibold">{s.label}</p>
                <p className="mt-1 text-white/70">{s.text}</p>
              </li>
            ))}
          </ol>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {SAFETY.map(({ icon: Icon, title, text }) => (
              <div key={title} className="flex gap-4 rounded-2xl border border-white/10 bg-navy-950/40 p-6">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gold/15 text-gold">
                  <Icon className="size-6" aria-hidden />
                </span>
                <div>
                  <h3 className="text-lg font-bold">{title}</h3>
                  <p className="mt-1 text-white/70">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-24">
        <SectionHeading eyebrow="What's inside" title="One calm place for everything that matters." />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon, title, text }) => (
            <div key={title} className="group rounded-2xl border border-line bg-white p-6 shadow-[var(--shadow-soft)] transition-shadow hover:shadow-[var(--shadow-lift)]">
              <IconChip icon={icon} />
              <h3 className="mt-4 text-lg font-bold text-navy-900">{title}</h3>
              <p className="mt-1.5 text-muted">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- For you / for family ---------------- */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:pb-24">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-3xl bg-gold-soft p-8 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-gold-dark">For you</p>
            <h3 className="mt-3 font-serif text-2xl font-semibold text-navy-900">Peace of mind, in your own words.</h3>
            <ul className="mt-5 space-y-3">
              {['Write down what matters, one question at a time', 'Decide who receives each item — and what they should do', 'Change your mind whenever you like'].map((t) => (
                <li key={t} className="flex gap-3"><CheckCircle2 className="mt-1 size-5 shrink-0 text-gold-dark" aria-hidden /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-navy-100 p-8 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-navy-700">For your family</p>
            <h3 className="mt-3 font-serif text-2xl font-semibold text-navy-900">Clarity at the hardest time.</h3>
            <ul className="mt-5 space-y-3">
              {['A private invitation — nothing visible until it is needed', 'Clear instructions for every account and policy', 'Personal letters, delivered only to them'].map((t) => (
                <li key={t} className="flex gap-3"><CheckCircle2 className="mt-1 size-5 shrink-0 text-navy-700" aria-hidden /> {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------- FAQ ---------------- */}
      <section id="faq" className="scroll-mt-6 border-t border-line bg-white">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:py-24">
          <SectionHeading eyebrow="Questions" title="Common questions" />
          <div className="mt-10 divide-y divide-line rounded-2xl border border-line">
            {FAQ.map(({ q, a }) => (
              <details key={q} className="group px-6 py-5 open:bg-paper/60">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-bold text-navy-900">
                  {q}
                  <ChevronDown className="size-5 shrink-0 transition-transform group-open:rotate-180" aria-hidden />
                </summary>
                <p className="mt-3 text-muted">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- Call to action ---------------- */}
      <section className="px-4 py-20 sm:px-6">
        <div className="bg-hero grain relative mx-auto max-w-5xl overflow-hidden rounded-3xl px-6 py-14 text-center text-white sm:px-12">
          <h2 className="relative font-serif text-3xl font-semibold sm:text-4xl">Start your plan today — it takes about five minutes.</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-lg text-white/75">
            Already invited by someone? Open the link in your email and it will guide you step by step.
          </p>
          <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button to="/register" variant="gold" size="lg" icon={ArrowRight}>Create my free plan</Button>
            <Button to="/login" variant="light" size="lg">Log in</Button>
          </div>
        </div>
      </section>
    </>
  );
}
