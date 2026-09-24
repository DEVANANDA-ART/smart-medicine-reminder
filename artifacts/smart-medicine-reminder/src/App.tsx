import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  ArrowRight,
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  HeartPulse,
  ImagePlus,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Plus,
  ScanLine,
  ShieldCheck,
  Trash2,
  UserRound,
  Volume2,
  X,
} from 'lucide-react';
import {
  getGetDashboardSummaryQueryKey,
  getGetMedicineQueryKey,
  getGetMeQueryKey,
  getListMedicinesQueryKey,
  getListRemindersQueryKey,
  useCreateMedicine,
  useCreateReminder,
  useDeleteMedicine,
  useDismissReminder,
  useGetDashboardSummary,
  useGetMedicine,
  useGetMe,
  useIdentifyTablet,
  useListMedicines,
  useListReminders,
  useLogin,
  useLogout,
  useMarkReminderSkipped,
  useMarkReminderTaken,
  useRegister,
  useUpdateMedicine,
  type Medicine,
  type MedicineInputFrequency,
  type Reminder,
  type TabletIdentification,
  MedicineInputFrequency as Frequency,
} from '@workspace/api-client-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation, useParams } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

const cx = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ');

function LoadingBlock({ label = 'Loading your care plan' }: { label?: string }) {
  return (
    <div className="space-y-4 animate-pulse" data-testid="loading-state">
      <div className="h-9 w-56 rounded-lg bg-muted" />
      <div className="h-4 w-80 max-w-full rounded bg-muted" />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-44 rounded-2xl bg-muted" />
        <div className="h-44 rounded-2xl bg-muted" />
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

function ErrorNotice({ message = 'We could not load this page.' }: { message?: string }) {
  return (
    <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5 text-accent-foreground" data-testid="error-state">
      <div className="flex items-start gap-3">
        <CircleHelp className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">A small interruption</p>
          <p className="mt-1 text-sm opacity-80">{message} Please try again in a moment.</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ title, copy, action }: { title: string; copy: string; action?: React.ReactNode }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/60 px-5 text-center" data-testid="empty-state">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-secondary text-primary">
        <Pill className="h-5 w-5" />
      </div>
      <p className="font-serif text-xl font-semibold">{title}</p>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{copy}</p>
      {action}
    </div>
  );
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3" data-testid="brand-mark">
      <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <Pill className="h-5 w-5 -rotate-45" strokeWidth={2.2} />
        <span className="absolute bottom-1 right-1 h-2 w-2 rounded-full bg-accent" />
      </div>
      {!compact && (
        <div>
          <p className="font-serif text-xl font-bold leading-none tracking-tight">Smart Medicine</p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.2em] opacity-60">Reminder</p>
        </div>
      )}
    </div>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const navItems = [
    { href: '/', label: 'Today', icon: LayoutDashboard },
    { href: '/reminders', label: 'Reminders', icon: Bell },
    { href: '/tablet-identifier', label: 'Tablet identifier', icon: ScanLine },
    { href: '/profile', label: 'Profile', icon: UserRound },
  ];
  const signOut = () =>
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.removeQueries({ queryKey: getGetMeQueryKey() });
        setLocation('/');
      },
    });

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-sidebar px-5 py-6 text-sidebar-foreground md:flex">
        <Link href="/" className="mb-12 block" data-testid="link-home-brand">
          <BrandMark />
        </Link>
        <div className="mb-4 px-3 font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-foreground/50">Your space</div>
        <nav className="space-y-1.5" aria-label="Primary navigation">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              data-testid={`link-nav-${label.toLowerCase().replaceAll(' ', '-')}`}
              className={cx(
                'group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors',
                location === href ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
              {href === '/reminders' && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" />}
            </Link>
          ))}
        </nav>
        <div className="mt-auto rounded-2xl border border-sidebar-border bg-sidebar-accent/60 p-4">
          <div className="mb-3 flex items-center justify-between">
            <ShieldCheck className="h-5 w-5 text-sidebar-primary" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-sidebar-foreground/45">Private</span>
          </div>
          <p className="text-sm font-medium">A gentle place to remember.</p>
          <p className="mt-1 text-xs leading-5 text-sidebar-foreground/55">Smart Medicine Reminder helps you keep your routine close, without giving medical advice.</p>
        </div>
        <button type="button" onClick={signOut} disabled={logout.isPending} className="mt-5 flex items-center gap-3 px-3 py-2 text-sm text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground" data-testid="button-signout-sidebar">
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </aside>
      <header className="sticky top-0 z-30 flex h-[70px] items-center justify-between border-b border-border/70 bg-background/90 px-5 backdrop-blur-md md:hidden">
        <Link href="/" data-testid="link-home-mobile"><BrandMark compact /></Link>
        <button type="button" className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-card" onClick={() => setMenuOpen((v) => !v)} aria-label="Open menu" data-testid="button-open-mobile-menu">
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>
      {menuOpen && (
        <div className="absolute right-5 top-[62px] z-40 w-56 rounded-2xl border border-border bg-card p-2 shadow-lg md:hidden">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-secondary" data-testid={`link-mobile-${label.toLowerCase().replaceAll(' ', '-')}`}>
              <Icon className="h-4 w-4 text-primary" /> {label}
            </Link>
          ))}
          <button type="button" onClick={signOut} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm text-destructive hover:bg-destructive/10" data-testid="button-signout-mobile"><LogOut className="h-4 w-4" /> Sign out</button>
        </div>
      )}
      <main className="min-h-[100dvh] md:ml-[248px]">
        <div className="mx-auto max-w-[1230px] px-5 py-8 pb-24 sm:px-8 lg:px-12 lg:py-12">{children}</div>
      </main>
      <ReminderAlarm />
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-border bg-card/95 py-2 backdrop-blur-md md:hidden" aria-label="Mobile navigation">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={cx('flex flex-col items-center gap-1 py-1 text-[10px] font-medium', location === href ? 'text-primary' : 'text-muted-foreground')} data-testid={`link-bottom-${label.toLowerCase().replaceAll(' ', '-')}`}>
            <Icon className="h-5 w-5" /> {label === 'Tablet identifier' ? 'Identify' : label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

let alarmAudioContext: AudioContext | null = null;

function getAlarmAudioContext() {
  const AudioContextClass = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  alarmAudioContext ??= new AudioContextClass();
  return alarmAudioContext;
}

function playAlarmTone() {
  try {
    const context = getAlarmAudioContext();
    if (!context) return;
    const play = () => {
      for (let index = 0; index < 3; index += 1) {
        const start = context.currentTime + index * 0.55;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = index % 2 === 0 ? 740 : 880;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.24, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.35);
      }
    };
    if (context.state === 'suspended') {
      void context.resume().then(play).catch(() => undefined);
    } else {
      play();
    }
  } catch {
    // Browser autoplay policies can block sound; the visual alert remains available.
  }
}

function localDateKey(date: Date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function isDueInBrowser(reminder: Reminder) {
  if (reminder.status !== 'upcoming') return false;
  const scheduledDate = new Date(reminder.reminderDate).toISOString().slice(0, 10);
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return scheduledDate === localDateKey(now) && reminder.reminderTime <= currentTime;
}

function ReminderAlarm() {
  const [activeReminder, setActiveReminder] = useState<Reminder | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<number>>(new Set());
  const [clockTick, setClockTick] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const remindersQuery = useListReminders({ filter: 'today' }, { query: { queryKey: getListRemindersQueryKey({ filter: 'today' }), refetchInterval: 5000 } });
  const taken = useMarkReminderTaken();
  const skipped = useMarkReminderSkipped();
  const dismiss = useDismissReminder();
  const queryClient = useQueryClient();

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      void Notification.requestPermission().catch(() => undefined);
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setClockTick((tick) => tick + 1), 5000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const primeAudio = () => {
      const context = getAlarmAudioContext();
      if (!context) return;
      void context.resume().then(() => setSoundEnabled(true)).catch(() => undefined);
    };
    window.addEventListener('pointerdown', primeAudio);
    window.addEventListener('keydown', primeAudio);
    return () => {
      window.removeEventListener('pointerdown', primeAudio);
      window.removeEventListener('keydown', primeAudio);
    };
  }, []);

  useEffect(() => {
    const due = remindersQuery.data?.find((reminder) => (reminder.status === 'due' || isDueInBrowser(reminder)) && !dismissedIds.has(reminder.id));
    if (!due || activeReminder?.id === due.id) return;
    setActiveReminder(due);
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Medicine reminder', {
        body: `${due.medicineName} · ${due.dosage} · ${due.reminderTime}`,
        tag: `medicine-reminder-${due.id}`,
      });
    }
  }, [activeReminder?.id, clockTick, dismissedIds, remindersQuery.data]);

  useEffect(() => {
    if (!activeReminder) return;
    playAlarmTone();
    const interval = window.setInterval(playAlarmTone, 1700);
    return () => window.clearInterval(interval);
  }, [activeReminder?.id]);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
    void queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };
  const takeAction = (action: typeof taken | typeof skipped, reminder: Reminder) => {
    setActiveReminder(null);
    action.mutate({ id: reminder.id }, {
      onSuccess: refresh,
    });
  };
  const dismissAlarm = () => {
    if (!activeReminder) return;
    const reminderId = activeReminder.id;
    // Dismiss is a local alarm action, so close immediately even if the
    // background request is delayed. Keep the due record unchanged.
    setDismissedIds((ids) => new Set(ids).add(reminderId));
    setActiveReminder(null);
    dismiss.mutate({ id: reminderId });
  };
  const testAlarmSound = () => {
    playAlarmTone();
    setSoundEnabled(true);
  };

  if (!activeReminder) return null;
  const busy = taken.isPending || skipped.isPending || dismiss.isPending;
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-sidebar/70 p-5 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="reminder-alarm-title" data-testid="reminder-alarm-modal">
      <div className="w-full max-w-md overflow-hidden rounded-[1.8rem] border border-border bg-card shadow-2xl">
        <div className="bg-accent/15 px-6 py-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-accent-foreground">Reminder due now</span>
            <Bell className="h-5 w-5 animate-pulse text-accent-foreground" />
          </div>
          <p className="mt-5 font-serif text-4xl font-semibold tracking-tight" id="reminder-alarm-title">{activeReminder.medicineName}</p>
          <p className="mt-2 text-sm text-accent-foreground/80">{activeReminder.dosage} · scheduled for {activeReminder.reminderTime}</p>
        </div>
        <div className="p-6">
          <div className="mb-6 flex items-center gap-4 rounded-2xl bg-secondary p-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-card text-primary">
              {activeReminder.tabletImage ? <img src={activeReminder.tabletImage} alt={`${activeReminder.medicineName} tablet`} className="h-full w-full object-cover" /> : <Pill className="h-7 w-7 -rotate-45" />}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your scheduled dose</p>
              <p className="mt-1 text-sm leading-5">Choose Taken or Skip to keep today’s record accurate.</p>
            </div>
          </div>
           <button type="button" onClick={testAlarmSound} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground" data-testid="button-test-alarm-sound"><Volume2 className="h-3.5 w-3.5" /> {soundEnabled ? 'Test alarm sound' : 'Enable alarm sound'}</button>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" disabled={busy} onClick={() => takeAction(taken, activeReminder)} className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60" data-testid="button-alarm-taken"><Check className="h-4 w-4" /> Taken</button>
            <button type="button" disabled={busy} onClick={() => takeAction(skipped, activeReminder)} className="h-12 rounded-xl border border-border text-sm font-bold text-foreground transition-colors hover:bg-secondary disabled:opacity-60" data-testid="button-alarm-skipped">Skip</button>
          </div>
          <button type="button" disabled={busy} onClick={dismissAlarm} className="mt-3 flex w-full items-center justify-center gap-2 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60" data-testid="button-alarm-dismiss"><X className="h-3.5 w-3.5" /> Dismiss alarm</button>
          <p className="mt-4 text-center text-[11px] leading-5 text-muted-foreground">Browser alarms work while this app is open. Notifications depend on your browser permissions.</p>
        </div>
      </div>
    </div>
  );
}

function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const login = useLogin();
  const register = useRegister();
  const pending = login.isPending || register.isPending;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (mode === 'login') {
      login.mutate({ data: { email: form.email, password: form.password } }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }); setLocation(location || '/'); },
        onError: () => setMessage('That sign-in did not work. Check your details and try again.'),
      });
    } else {
      register.mutate({ data: form }, {
        onSuccess: () => { queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() }); setLocation(location || '/'); },
        onError: () => setMessage('We could not create your account. Please check the fields and try again.'),
      });
    }
  };
  return (
    <div className="min-h-[100dvh] overflow-hidden bg-background">
      <div className="grid min-h-[100dvh] lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative hidden overflow-hidden bg-sidebar p-12 text-sidebar-foreground lg:flex lg:flex-col lg:justify-between">
          <div className="absolute -right-24 top-24 h-80 w-80 rounded-full border-[38px] border-sidebar-primary/20" />
          <div className="absolute -bottom-28 -left-16 h-80 w-80 rounded-full border-[38px] border-accent/20" />
          <BrandMark />
          <div className="relative max-w-lg">
            <p className="mb-5 font-mono text-xs uppercase tracking-[0.22em] text-sidebar-primary">A steadier everyday</p>
            <h1 className="font-serif text-6xl font-semibold leading-[0.98] tracking-tight">Small reminders.<br /><span className="text-sidebar-primary">A little more ease.</span></h1>
            <p className="mt-7 max-w-md text-base leading-7 text-sidebar-foreground/65">Keep your medicines, reminders, and daily rhythm in one quiet place. Made to be checked in a glance.</p>
          </div>
          <p className="text-xs text-sidebar-foreground/45">Your care routine belongs to you.</p>
        </section>
        <section className="flex items-center justify-center px-5 py-10 sm:px-10">
          <div className="w-full max-w-[430px]">
            <div className="mb-10 lg:hidden"><BrandMark /></div>
            <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Welcome to Smart Medicine Reminder</p>
            <h2 className="font-serif text-4xl font-semibold tracking-tight">{mode === 'login' ? 'Good to see you.' : 'Make room for routine.'}</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{mode === 'login' ? 'Your daily care journal is ready when you are.' : 'Create a private space for the reminders that matter.'}</p>
            <div className="mt-8 flex gap-1 border-b border-border">
              {(['login', 'register'] as const).map((tab) => (
                <button type="button" key={tab} onClick={() => { setMode(tab); setMessage(''); }} className={cx('border-b-2 px-1 pb-3 text-sm font-semibold capitalize transition-colors', mode === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground')} data-testid={`button-auth-${tab}`}>{tab === 'login' ? 'Sign in' : 'Create account'}</button>
              ))}
            </div>
            <form className="mt-7 space-y-5" onSubmit={submit}>
              {mode === 'register' && <Field label="Your name" value={form.name} onChange={(value) => setForm({ ...form, name: value })} placeholder="How should we greet you?" testId="input-name" />}
              <Field label="Email address" type="email" value={form.email} onChange={(value) => setForm({ ...form, email: value })} placeholder="you@example.com" testId="input-email" />
              <Field label="Password" type="password" value={form.password} onChange={(value) => setForm({ ...form, password: value })} placeholder="At least 8 characters" testId="input-password" />
              {message && <p className="rounded-xl bg-accent/10 px-4 py-3 text-sm text-accent-foreground" data-testid="auth-error">{message}</p>}
              <button type="submit" disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60" data-testid="button-auth-submit">
                {pending ? 'Preparing your space…' : mode === 'login' ? 'Sign in' : 'Create my space'} <ArrowRight className="h-4 w-4" />
              </button>
            </form>
            <div className="mt-10 flex items-start gap-3 border-t border-border pt-5 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> Your routine is personal. Smart Medicine Reminder keeps this space focused on remembering, not advising.</div>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', testId }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; testId: string }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold">{label}</span>
      <input type={type} required value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none transition-shadow placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid={testId} />
    </label>
  );
}

function PageHeader({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
        <h1 className="font-serif text-4xl font-semibold tracking-tight sm:text-5xl" data-testid="text-page-title">{title}</h1>
        {copy && <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{copy}</p>}
      </div>
      {action}
    </div>
  );
}

function ReminderRow({ reminder, onChange }: { reminder: Reminder; onChange: () => void }) {
  const taken = useMarkReminderTaken();
  const skipped = useMarkReminderSkipped();
  const busy = taken.isPending || skipped.isPending;
  const take = () => taken.mutate({ id: reminder.id }, { onSuccess: onChange });
  const skip = () => skipped.mutate({ id: reminder.id }, { onSuccess: onChange });
  return (
    <div className={cx('group flex flex-col gap-4 border-b border-border/70 py-5 first:pt-0 last:border-0 sm:flex-row sm:items-center sm:justify-between', reminder.status === 'taken' && 'opacity-70')} data-testid={`row-reminder-${reminder.id}`}>
      <div className="flex min-w-0 items-center gap-4">
        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-secondary text-primary">
          {reminder.tabletImage ? <img src={reminder.tabletImage} alt="" className="h-full w-full object-cover" /> : <Pill className="h-5 w-5 -rotate-45" />}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2"><p className="truncate font-semibold" data-testid={`text-reminder-name-${reminder.id}`}>{reminder.medicineName}</p><StatusPill status={reminder.status} /></div>
          <p className="mt-1 text-sm text-muted-foreground">{reminder.dosage} <span className="mx-1 text-border">·</span> {reminder.reminderTime}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 pl-16 sm:pl-0">
        {reminder.status === 'due' && <button type="button" disabled={busy} onClick={take} className="flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-50" data-testid={`button-take-${reminder.id}`}><Check className="h-3.5 w-3.5" /> Taken</button>}
        {reminder.status === 'due' && <button type="button" disabled={busy} onClick={skip} className="h-9 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-secondary disabled:opacity-50" data-testid={`button-skip-${reminder.id}`}>Skip</button>}
        {reminder.status === 'taken' && <span className="flex items-center gap-1.5 text-xs font-semibold text-primary"><CheckCircle2 className="h-4 w-4" /> Noted</span>}
        {reminder.status === 'skipped' && <button type="button" disabled={busy} onClick={take} className="h-9 rounded-lg border border-primary/30 px-3 text-xs font-semibold text-primary hover:bg-primary/5 disabled:opacity-50" data-testid={`button-restore-${reminder.id}`}>Mark taken</button>}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const label = status === 'taken' ? 'Completed' : status === 'skipped' ? 'Skipped' : status === 'due' ? 'Due now' : 'Upcoming';
  return <span className={cx('rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-wide', status === 'taken' ? 'bg-primary/10 text-primary' : status === 'skipped' ? 'bg-muted text-muted-foreground' : status === 'due' ? 'bg-accent/15 text-accent-foreground' : 'bg-secondary text-secondary-foreground')} data-testid={`status-${status}`}>{label}</span>;
}

function Dashboard({ user }: { user: { name: string } }) {
  const summaryQuery = useGetDashboardSummary();
  const medicinesQuery = useListMedicines();
  const queryClient = useQueryClient();
  const summary = summaryQuery.data;
  const firstName = user.name.split(' ')[0];
  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() });
  };
  if (summaryQuery.isLoading || medicinesQuery.isLoading) return <LoadingBlock />;
  if (summaryQuery.isError) return <ErrorNotice message="Your dashboard is taking a moment to settle." />;
  const today = summary?.today ?? [];
  const medicines = medicinesQuery.data ?? [];
  return (
    <>
       <PageHeader eyebrow={new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())} title={`Good morning, ${firstName}.`} copy="Here is the shape of your day. One reminder at a time." action={<Link href="/add-medicine" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="link-add-medicine-header"><Plus className="h-4 w-4" /> Add medicine + picture</Link>} />
      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.9fr]">
        <section className="relative overflow-hidden rounded-[1.6rem] bg-sidebar p-6 text-sidebar-foreground shadow-md sm:p-8" data-testid="card-next-reminder">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full border-[34px] border-sidebar-primary/15" />
          <div className="relative flex items-start justify-between">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-sidebar-primary">Next in your rhythm</p><p className="mt-7 font-serif text-5xl font-semibold tracking-tight">{summary?.nextReminder?.reminderTime ?? '—'}</p><p className="mt-2 text-sm text-sidebar-foreground/60">{summary?.nextReminder ? `${summary.nextReminder.medicineName} · ${summary.nextReminder.dosage}` : 'Nothing else is scheduled today'}</p></div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-sidebar-primary/15 text-sidebar-primary"><Clock3 className="h-5 w-5" /></div>
          </div>
          {summary?.nextReminder && <div className="relative mt-8 flex items-center justify-between border-t border-sidebar-border pt-4 text-xs text-sidebar-foreground/55"><span>Keep this moment for yourself.</span><Link href="/reminders" className="flex items-center gap-1 font-semibold text-sidebar-primary" data-testid="link-view-reminders-hero">View reminders <ArrowRight className="h-3.5 w-3.5" /></Link></div>}
        </section>
        <section className="rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-8" data-testid="card-adherence">
          <div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Today's follow-through</p><p className="mt-4 font-serif text-5xl font-semibold text-primary">{summary?.adherencePercent ?? 0}<span className="text-2xl">%</span></p></div><div className="relative grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary"><Activity className="h-5 w-5" /></div></div>
          <div className="mt-7 h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${Math.min(100, summary?.adherencePercent ?? 0)}%` }} /></div>
          <p className="mt-3 text-sm text-muted-foreground"><strong className="text-foreground">{summary?.takenCount ?? 0}</strong> of {summary?.totalCount ?? 0} reminders checked off</p>
        </section>
      </div>
      <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-8" data-testid="section-todays-medicines">
          <div className="mb-6 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Today</p><h2 className="mt-2 font-serif text-2xl font-semibold">Your check-in list</h2></div><Link href="/reminders" className="text-xs font-bold text-primary hover:underline" data-testid="link-all-today">See all</Link></div>
          {today.length ? today.map((reminder) => <ReminderRow key={reminder.id} reminder={reminder} onChange={refresh} />) : <EmptyState title="A clear day ahead" copy="There are no reminders here yet. Add a medicine to begin your routine." action={<Link href="/add-medicine" className="mt-4 text-sm font-bold text-primary" data-testid="link-empty-add">Add your first medicine <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link>} />}
        </section>
        <section className="rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-8" data-testid="section-medicine-shelf">
          <div className="mb-6 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">On your shelf</p><h2 className="mt-2 font-serif text-2xl font-semibold">Medicines</h2></div><span className="font-mono text-xs text-muted-foreground">{medicines.length.toString().padStart(2, '0')}</span></div>
           {medicines.length ? <div className="space-y-2">{medicines.slice(0, 5).map((medicine) => <MedicineMiniCard key={medicine.id} medicine={medicine} />)}</div> : <EmptyState title="Your shelf is open" copy="Add a medicine name and picture to keep it easy to recognize." action={<Link href="/add-medicine" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-primary" data-testid="link-shelf-add">Add medicine + picture <ArrowRight className="h-3.5 w-3.5" /></Link>} />}
          {!!medicines.length && <Link href="/add-medicine" className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-xs font-bold text-muted-foreground transition-colors hover:border-primary hover:text-primary" data-testid="link-shelf-add-more"><Plus className="h-3.5 w-3.5" /> Add another</Link>}
        </section>
      </div>
    </>
  );
}

function MedicineMiniCard({ medicine }: { medicine: Medicine }) {
  return <Link href={`/medicines/${medicine.id}/edit`} className="flex items-center gap-3 rounded-xl border border-transparent p-2 transition-colors hover:border-border hover:bg-secondary/50" data-testid={`link-medicine-${medicine.id}`}><div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary text-primary">{medicine.tabletImage ? <img src={medicine.tabletImage} alt="" className="h-full w-full object-cover" /> : <Pill className="h-4 w-4 -rotate-45" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{medicine.medicineName}</p><p className="text-xs text-muted-foreground">{medicine.dosage} · {medicine.reminderTimes.length} {medicine.reminderTimes.length === 1 ? 'reminder' : 'reminders'}</p></div><ChevronRight className="h-4 w-4 text-muted-foreground" /></Link>;
}

function MedicineForm({ edit = false }: { edit?: boolean }) {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const medicineQuery = useGetMedicine(id, { query: { enabled: edit && !!id, queryKey: getGetMedicineQueryKey(id) } });
  const create = useCreateMedicine();
  const update = useUpdateMedicine();
  const remove = useDeleteMedicine();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ medicineName: '', dosage: '', frequency: Frequency.once_daily as MedicineInputFrequency, reminderTimes: ['08:00'], startDate: new Date().toISOString().slice(0, 10), endDate: '', tabletImage: '' });
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (edit && medicineQuery.data && !initialized) {
      const item = medicineQuery.data;
      setForm({ medicineName: item.medicineName, dosage: item.dosage, frequency: item.frequency as MedicineInputFrequency, reminderTimes: item.reminderTimes, startDate: item.startDate.slice(0, 10), endDate: item.endDate?.slice(0, 10) ?? '', tabletImage: item.tabletImage ?? '' });
      setInitialized(true);
    }
  }, [edit, medicineQuery.data, initialized]);
  const handleImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((old) => ({ ...old, tabletImage: String(reader.result) }));
    reader.readAsDataURL(file);
  };
  const setFrequency = (frequency: MedicineInputFrequency) => {
    const count = frequency === Frequency.once_daily ? 1 : frequency === Frequency.twice_daily ? 2 : frequency === Frequency.three_daily ? 3 : form.reminderTimes.length;
    setForm((old) => ({ ...old, frequency, reminderTimes: Array.from({ length: Math.max(1, count) }, (_, index) => old.reminderTimes[index] ?? ['08:00', '13:00', '20:00'][index] ?? '08:00') }));
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    const data = { medicineName: form.medicineName, tabletImage: form.tabletImage || null, dosage: form.dosage, frequency: form.frequency, reminderTimes: form.reminderTimes, startDate: form.startDate, endDate: form.endDate || null };
    if (edit) update.mutate({ id, data }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListMedicinesQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetMedicineQueryKey(id) }); setLocation('/'); }, onError: () => setError('We could not save this medicine. Please try again.') });
    else create.mutate({ data }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListMedicinesQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); setLocation('/'); }, onError: () => setError('We could not add this medicine. Please try again.') });
  };
  const deleteItem = () => {
    if (!window.confirm('Remove this medicine and its reminders?')) return;
    remove.mutate({ id }, { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListMedicinesQueryKey() }); setLocation('/'); } });
  };
  if (edit && medicineQuery.isLoading) return <LoadingBlock label="Loading medicine details" />;
  if (edit && medicineQuery.isError) return <ErrorNotice message="We could not find that medicine." />;
  const pending = create.isPending || update.isPending;
  return (
    <>
      <PageHeader eyebrow={edit ? 'Edit your shelf' : 'Add to your shelf'} title={edit ? 'Keep it current.' : 'Add medicine details.'} copy={edit ? 'Update the details so each reminder feels right.' : 'Add the medicine name and a picture so each reminder is easy to recognize.'} action={<Link href="/" className="text-sm font-semibold text-muted-foreground hover:text-foreground" data-testid="link-cancel-medicine">Cancel</Link>} />
      <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_350px]" data-testid="form-medicine">
        <div className="space-y-6">
          <section className="rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-8"><p className="mb-6 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">The basics</p><div className="grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2"><Field label="Medicine name" value={form.medicineName} onChange={(value) => setForm({ ...form, medicineName: value })} placeholder="For example, evening vitamins" testId="input-medicine-name" /></div><Field label="Dosage" value={form.dosage} onChange={(value) => setForm({ ...form, dosage: value })} placeholder="For example, 1 tablet" testId="input-dosage" /><label className="block space-y-2"><span className="text-sm font-semibold">How often?</span><select value={form.frequency} onChange={(event) => setFrequency(event.target.value as MedicineInputFrequency)} className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="select-frequency"><option value={Frequency.once_daily}>Once a day</option><option value={Frequency.twice_daily}>Twice a day</option><option value={Frequency.three_daily}>Three times a day</option><option value={Frequency.custom}>Custom</option></select></label></div></section>
          <section className="rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-8"><div className="mb-6 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Your rhythm</p><h2 className="mt-2 font-serif text-2xl font-semibold">Reminder times</h2></div><Clock3 className="h-5 w-5 text-primary" /></div><div className="grid gap-3 sm:grid-cols-2">{form.reminderTimes.map((time, index) => <label key={index} className="block space-y-2"><span className="text-xs font-semibold text-muted-foreground">Reminder {index + 1}</span><input type="time" required value={time} onChange={(event) => setForm({ ...form, reminderTimes: form.reminderTimes.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid={`input-reminder-time-${index}`} /></label>)}</div>{form.frequency === Frequency.custom && <button type="button" onClick={() => setForm({ ...form, reminderTimes: [...form.reminderTimes, '08:00'] })} className="mt-5 flex items-center gap-2 text-sm font-bold text-primary" data-testid="button-add-time"><Plus className="h-4 w-4" /> Add another time</button>}</section>
          <section className="rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-8"><p className="mb-6 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Dates</p><div className="grid gap-5 sm:grid-cols-2"><label className="block space-y-2"><span className="text-sm font-semibold">Start date</span><input type="date" required value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="input-start-date" /></label><label className="block space-y-2"><span className="text-sm font-semibold">End date <span className="font-normal text-muted-foreground">(optional)</span></span><input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10" data-testid="input-end-date" /></label></div></section>
        </div>
          <div className="space-y-6"><section className="rounded-[1.6rem] border border-border bg-card p-6 shadow-sm"><p className="mb-5 font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Medicine picture</p><label className="group relative flex aspect-square cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/50 text-center transition-colors hover:border-primary">{form.tabletImage ? <><img src={form.tabletImage} alt="Medicine preview" className="h-full w-full object-cover" data-testid="img-tablet-preview" /><span className="absolute bottom-3 rounded-lg bg-sidebar/85 px-3 py-2 text-xs font-semibold text-sidebar-foreground">Replace medicine picture</span></> : <><ImagePlus className="mb-3 h-7 w-7 text-primary" /><span className="text-sm font-semibold">Add medicine picture</span><span className="mt-1 px-6 text-xs text-muted-foreground">Choose a clear picture to recognize this medicine quickly.</span></>}<input type="file" accept="image/*" onChange={handleImage} className="sr-only" data-testid="input-tablet-image" /></label>{form.tabletImage && <button type="button" onClick={() => setForm({ ...form, tabletImage: '' })} className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-destructive" data-testid="button-remove-image"><X className="h-3.5 w-3.5" /> Remove medicine picture</button>}</section>{error && <p className="rounded-xl bg-accent/10 p-4 text-sm text-accent-foreground" data-testid="medicine-form-error">{error}</p>}<button type="submit" disabled={pending} className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-60" data-testid="button-save-medicine">{pending ? 'Saving…' : edit ? 'Save changes' : 'Add medicine'} <Check className="h-4 w-4" /></button>{edit && <><p className="text-center text-xs leading-5 text-muted-foreground">This removes the medicine and all of its scheduled reminders.</p><button type="button" disabled={remove.isPending} onClick={deleteItem} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/25 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60" data-testid="button-delete-medicine"><Trash2 className="h-4 w-4" /> {remove.isPending ? 'Removing…' : 'Remove medicine'}</button></>}</div>
      </form>
    </>
  );
}

function RemindersPage() {
  const [filter, setFilter] = useState<'today' | 'upcoming' | 'completed' | 'skipped' | 'all'>('today');
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ medicineId: '', reminderTime: '08:00', reminderDate: new Date().toISOString().slice(0, 10) });
  const medicinesQuery = useListMedicines();
  const params = filter === 'all' ? undefined : { filter };
  const remindersQuery = useListReminders(params, { query: { queryKey: getListRemindersQueryKey(params) } });
  const createReminder = useCreateReminder();
  const queryClient = useQueryClient();
  const refresh = () => { queryClient.invalidateQueries({ queryKey: getListRemindersQueryKey() }); queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() }); };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    createReminder.mutate({ data: { medicineId: Number(form.medicineId), reminderTime: form.reminderTime, reminderDate: form.reminderDate } }, { onSuccess: () => { setShowAdd(false); refresh(); } });
  };
  const tabs = [['today', "Today's"], ['upcoming', 'Upcoming'], ['completed', 'Completed'], ['skipped', 'Skipped'], ['all', 'All']] as const;
  return (
    <>
      <PageHeader eyebrow="Keep the thread" title="Reminders." copy="A clear view of what is next, what is done, and what can wait." action={<button type="button" onClick={() => setShowAdd((v) => !v)} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5" data-testid="button-add-reminder"><Plus className="h-4 w-4" /> One-time reminder</button>} />
      {showAdd && <form onSubmit={submit} className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5" data-testid="form-add-reminder"><div className="grid gap-4 sm:grid-cols-[1fr_150px_150px_auto] sm:items-end"><label className="block space-y-2"><span className="text-xs font-semibold">Medicine</span><select required value={form.medicineId} onChange={(event) => setForm({ ...form, medicineId: event.target.value })} className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm" data-testid="select-reminder-medicine"><option value="">Choose a medicine</option>{(medicinesQuery.data ?? []).map((medicine) => <option key={medicine.id} value={medicine.id}>{medicine.medicineName}</option>)}</select></label><label className="block space-y-2"><span className="text-xs font-semibold">Time</span><input required type="time" value={form.reminderTime} onChange={(event) => setForm({ ...form, reminderTime: event.target.value })} className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm" data-testid="input-one-time-time" /></label><label className="block space-y-2"><span className="text-xs font-semibold">Date</span><input required type="date" value={form.reminderDate} onChange={(event) => setForm({ ...form, reminderDate: event.target.value })} className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm" data-testid="input-one-time-date" /></label><button disabled={createReminder.isPending} className="h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground disabled:opacity-60" data-testid="button-save-reminder">{createReminder.isPending ? 'Adding…' : 'Add'}</button></div></form>}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-border" role="tablist">{tabs.map(([value, label]) => <button type="button" key={value} onClick={() => setFilter(value)} className={cx('shrink-0 border-b-2 px-1 pb-3 mr-5 text-sm font-semibold transition-colors', filter === value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground')} data-testid={`tab-reminders-${value}`}>{label}</button>)}</div>
      <section className="rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-8" data-testid="section-reminders-list">
        {remindersQuery.isLoading ? <LoadingBlock label="Loading reminders" /> : remindersQuery.isError ? <ErrorNotice message="Your reminders are not available right now." /> : remindersQuery.data?.length ? remindersQuery.data.map((reminder) => <ReminderRow key={reminder.id} reminder={reminder} onChange={refresh} />) : <EmptyState title={filter === 'today' ? 'A clear day ahead' : 'Nothing in this view'} copy="When a reminder belongs here, it will appear with the time and medicine name." action={filter === 'today' ? <button type="button" onClick={() => setShowAdd(true)} className="mt-4 text-sm font-bold text-primary" data-testid="button-empty-reminder">Create a one-time reminder <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></button> : undefined} />}
      </section>
    </>
  );
}

function TabletIdentifierPage() {
  const [image, setImage] = useState('');
  const [result, setResult] = useState<TabletIdentification | null>(null);
  const identify = useIdentifyTablet();
  const chooseImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setImage(String(reader.result)); setResult(null); };
    reader.readAsDataURL(file);
  };
  const run = () => identify.mutate({ data: { imageData: image } }, { onSuccess: setResult });
  return (
    <>
      <PageHeader eyebrow="Prototype lab" title="Tablet identifier." copy="A visual experiment for organizing your shelf. It is not a medical tool and should never be used to identify medication." />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <section className="rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-8" data-testid="section-tablet-upload">
          <div className="mb-6 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">Step one</p><h2 className="mt-2 font-serif text-2xl font-semibold">Choose a tablet photo</h2></div><ScanLine className="h-5 w-5 text-primary" /></div>
          <label className="group relative flex min-h-[300px] cursor-pointer items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-secondary/40 transition-colors hover:border-primary">{image ? <img src={image} alt="Selected tablet preview" className="h-full max-h-[360px] w-full object-contain" data-testid="img-identifier-preview" /> : <div className="text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><ImagePlus className="h-6 w-6" /></div><p className="font-semibold">Upload an image</p><p className="mt-2 text-sm text-muted-foreground">Use a well-lit photo for this prototype.</p></div>}<input type="file" accept="image/*" onChange={chooseImage} className="sr-only" data-testid="input-identifier-image" /></label>
          <button type="button" disabled={!image || identify.isPending} onClick={run} className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50" data-testid="button-identify-tablet">{identify.isPending ? 'Reviewing image…' : 'Run demo identification'} <ArrowRight className="h-4 w-4" /></button>
        </section>
        <section className="rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-8" data-testid="section-identification-result">
          <div className="mb-6 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.2em] text-accent-foreground">Step two</p><h2 className="mt-2 font-serif text-2xl font-semibold">Prototype result</h2></div><span className="rounded-full bg-accent/15 px-2 py-1 font-mono text-[9px] uppercase tracking-wide text-accent-foreground">Demo only</span></div>
           {result ? <div className="animate-in fade-in"><div className="rounded-2xl bg-secondary p-5"><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Visual label</p><p className="mt-3 font-serif text-3xl font-semibold" data-testid="text-identification-label">{result.label}</p><div className="mt-6 flex items-center justify-between text-sm"><span className="text-muted-foreground">Prototype confidence</span><strong className="text-primary" data-testid="text-identification-confidence">{result.confidence}%</strong></div><div className="mt-2 h-2 rounded-full bg-card"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, result.confidence)}%` }} /></div></div><div className="mt-5 rounded-xl border border-accent/35 bg-accent/10 p-4 text-sm leading-6 text-accent-foreground"><strong className="block mb-1">Important note</strong>{result.disclaimer}</div></div> : <div className="flex min-h-[300px] flex-col items-center justify-center text-center"><div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-muted text-muted-foreground"><ScanLine className="h-6 w-6" /></div><p className="font-semibold">Your result will appear here</p><p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Upload a photo to see the clearly labeled demo response.</p></div>}
        </section>
      </div>
    </>
  );
}

function ProfilePage({ user }: { user: { id: number; name: string; email: string } }) {
  const logout = useLogout();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const initials = user.name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const signOut = () => logout.mutate(undefined, { onSuccess: () => { queryClient.removeQueries({ queryKey: getGetMeQueryKey() }); setLocation('/'); } });
  return (
    <>
      <PageHeader eyebrow="Your space" title="Profile." copy="The person at the center of this routine." />
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <section className="rounded-[1.6rem] border border-border bg-card p-6 shadow-sm sm:p-8" data-testid="section-profile">
          <div className="flex items-center gap-5 border-b border-border pb-7"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary font-serif text-2xl font-semibold text-primary-foreground" data-testid="text-profile-initials">{initials}</div><div><p className="font-serif text-2xl font-semibold" data-testid="text-profile-name">{user.name}</p><p className="mt-1 text-sm text-muted-foreground" data-testid="text-profile-email">{user.email}</p></div></div>
          <div className="mt-7 space-y-5"><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Account number</span><span className="font-mono text-xs">WT-{String(user.id).padStart(5, '0')}</span></div><div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Journal status</span><span className="flex items-center gap-2 font-semibold text-primary"><span className="h-2 w-2 rounded-full bg-primary" /> Active</span></div></div>
          <button type="button" onClick={signOut} disabled={logout.isPending} className="mt-8 flex h-11 items-center gap-2 rounded-xl border border-destructive/25 px-4 text-sm font-semibold text-destructive hover:bg-destructive/5 disabled:opacity-60" data-testid="button-signout-profile"><LogOut className="h-4 w-4" /> {logout.isPending ? 'Signing out…' : 'Sign out'}</button>
        </section>
        <section className="rounded-[1.6rem] bg-sidebar p-6 text-sidebar-foreground shadow-sm sm:p-8" data-testid="section-profile-note"><HeartPulse className="h-7 w-7 text-sidebar-primary" /><h2 className="mt-12 font-serif text-3xl font-semibold leading-tight">A reminder is a kindness, not a judgment.</h2><p className="mt-4 text-sm leading-6 text-sidebar-foreground/60">Smart Medicine Reminder is here to make remembering feel lighter. It does not diagnose, prescribe, or replace your care team.</p></section>
      </div>
    </>
  );
}

function RoutedApp() {
  const meQuery = useGetMe({ query: { queryKey: getGetMeQueryKey(), retry: false } });
  if (meQuery.isLoading) return <LoadingBlock label="Opening your journal" />;
  if (!meQuery.data) return <AuthScreen />;
  const user = meQuery.data;
  return <AppShell><Switch><Route path="/" component={() => <Dashboard user={user} />} /><Route path="/add-medicine" component={() => <MedicineForm />} /><Route path="/medicines/:id/edit" component={() => <MedicineForm edit />} /><Route path="/reminders" component={RemindersPage} /><Route path="/tablet-identifier" component={TabletIdentifierPage} /><Route path="/profile" component={() => <ProfilePage user={user} />} /><Route component={NotFound} /></Switch></AppShell>;
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><RoutedApp /></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;