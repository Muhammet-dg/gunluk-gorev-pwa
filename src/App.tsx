import { useState, useCallback, useMemo } from 'react';
import { Header } from './components/Header';
import { QuickCapture } from './components/QuickCapture';
import { CategoryPills } from './components/CategoryPills';
import { TaskList } from './components/TaskList';
import { TaskForm } from './components/TaskForm';
import { BottomNav } from './components/BottomNav';
import { StatsView } from './components/StatsView';
import { NotificationBanner } from './components/NotificationBanner';
import { AuthScreen } from './components/AuthScreen';
import { SettingsModal } from './components/SettingsModal';
import { FocusModal } from './components/FocusModal';
import { Confetti } from './components/Confetti';
import { BackgroundAnimation } from './components/BackgroundAnimation';
import { useTasks } from './hooks/useTasks';
import { useNotifications } from './hooks/useNotifications';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useStreak } from './hooks/useStreak';
import type { Tab, FilterCategory, Task } from './types';
import { CATEGORY_CONFIG } from './types';
import { Plus, AlertCircle, RefreshCw, Loader2, BarChart3 } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('tasks');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  const { theme, toggleTheme } = useTheme();

  // ─── Auth ──────────────────────────────────────────────────────────────────
  const {
    session,
    user,
    loading: authLoading,
    authLoading: authProcessing,
    authError,
    clearError,
    signIn,
    signUp,
    signOut,
  } = useAuth();

  // ─── Görev hook'u ──────────────────────────────────────────────────────────
  const userId = user?.id ?? '';
  const {
    activeTasks,
    completedTasks,
    archivedTasks,
    stats,
    loading,
    isSubmitting,
    error,
    addTask,
    toggleTask,
    deleteTask,
    snoozeTask,
    clearCompleted,
    restoreCompleted,
    archiveCompleted,
    restoreFromArchive,
    clearArchive,
    refetch,
  } = useTasks({ userId });

  // ─── Seri (Daily Streak) & Kutlama ─────────────────────────────────────────
  const { streak, showCelebration, dismissCelebration } = useStreak(
    userId,
    activeTasks.length,
    completedTasks,
    archivedTasks
  );

  // ─── Bildirimler ───────────────────────────────────────────────────────────
  const { permission, status: notifStatus, subscribe } = useNotifications({
    userId: user?.id ?? null,
  });

  const handleSubscribe = useCallback(async () => {
    await subscribe();
  }, [subscribe]);

  // ─── Kategori Filtrelemesi ─────────────────────────────────────────────────
  const filteredActiveTasks = useMemo(() => {
    if (selectedCategory === 'all') return activeTasks;
    if (selectedCategory === 'urgent') {
      return activeTasks.filter(
        (t) => t.category === 'urgent' || t.priority === 'high'
      );
    }
    return activeTasks.filter((t) => (t.category ?? 'personal') === selectedCategory);
  }, [activeTasks, selectedCategory]);

  const showHeader = activeTab === 'tasks' || activeTab === 'completed';

  const showNotifBanner =
    !bannerDismissed &&
    notifStatus !== 'unsupported' &&
    notifStatus !== 'subscribed' &&
    permission !== 'granted';

  // ── Auth durumu henüz bilinmiyor → Splash ──────────────────────────────────
  if (authLoading) {
    return (
      <div
        className="min-h-dvh h-dvh w-full flex items-center justify-center select-none"
        style={{ background: 'var(--bg)' }}
      >
        <div className="relative flex flex-col items-center gap-4 animate-fade-in">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{
              background: 'var(--primary)',
              boxShadow: '0 12px 32px var(--primary-glow)',
            }}
          >
            <Loader2 size={26} className="text-white animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-app-primary font-bold text-base tracking-tight">FlowDay</p>
            <p className="text-app-muted text-xs mt-0.5">Hazırlanıyor...</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Oturum açılmamış → Giriş / Kayıt Ekranı ────────────────────────────────
  if (!session) {
    return (
      <AuthScreen
        onSignIn={signIn}
        onSignUp={signUp}
        authLoading={authProcessing}
        authError={authError}
        clearError={clearError}
      />
    );
  }

  // ── Oturum açık → Ana Uygulama ────────────────────────────────────────────
  return (
    <div className="relative min-h-dvh h-dvh w-full bg-app flex items-center justify-center transition-colors duration-300 overflow-hidden">
      {/* Kullanıcının verdiği animasyon.css / animasyon.html siber yağmur arka planı */}
      <BackgroundAnimation />

      {/* Gün Tamamlandı Kutlama & Confetti */}
      {showCelebration && (
        <Confetti streak={streak} onDismiss={dismissCelebration} />
      )}

      {/* Mobil / PWA Çerçevesi */}
      <div
        className="relative w-full h-full sm:max-w-md sm:h-[93vh] sm:max-h-[900px] sm:rounded-[32px] sm:border bg-app/95 backdrop-blur-xl overflow-hidden flex flex-col transition-colors duration-300 select-none z-10"
        style={{
          borderColor: 'var(--border-strong)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.65)',
        }}
      >
        {/* ─── İlk Yükleme Katmanı ─── */}
        {loading === 'loading' &&
          activeTasks.length === 0 &&
          completedTasks.length === 0 && (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3.5"
              style={{ background: 'var(--overlay)', backdropFilter: 'blur(8px)' }}
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{
                  background: 'var(--primary-dim)',
                  border: '1px solid rgba(99, 102, 241, 0.25)',
                }}
              >
                <Loader2 size={22} className="text-indigo-400 animate-spin" />
              </div>
              <p className="text-app-secondary text-xs font-medium">
                Görevler senkronize ediliyor...
              </p>
            </div>
          )}

        {/* ─── Hata Banner'ı ─── */}
        {error && (
          <div
            className="mx-5 mt-4 z-30 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-lg animate-fade-in"
            style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.24)',
            }}
          >
            <AlertCircle size={15} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-xs flex-1 leading-snug">{error}</p>
            <button
              onClick={() => void refetch()}
              className="flex items-center gap-1 text-red-300 text-xs font-semibold hover:text-white transition-colors active:scale-90 flex-shrink-0"
            >
              <RefreshCw size={11} />
              <span>Tekrar dene</span>
            </button>
          </div>
        )}

        {/* ─── Kaydırılabilir İçerik Alanı ─── */}
        <div className="flex-1 overflow-y-auto overscroll-none pb-28">
          {showHeader && (
            <Header
              activeCount={activeTasks.length}
              completedCount={completedTasks.length}
              streak={streak}
              theme={theme}
              onToggleTheme={toggleTheme}
              userEmail={user?.email ?? ''}
              onOpenSettings={() => setShowSettings(true)}
            />
          )}

          {/* Bildirim İzin Banner'ı */}
          {showNotifBanner && (
            <NotificationBanner
              status={notifStatus}
              onSubscribe={() => void handleSubscribe()}
              onDismiss={() => setBannerDismissed(true)}
            />
          )}

          {/* ─── GÖREVLER SEKMESİ ─── */}
          {activeTab === 'tasks' && (
            <div>
              {/* 1. Hızlı & Doğal Görev Girişi (Quick Capture) */}
              <QuickCapture
                onAdd={(data) => {
                  void addTask(data);
                }}
                defaultCategory={
                  selectedCategory === 'all' ? 'personal' : selectedCategory
                }
              />

              {/* 2. Kategori & Akıllı Filtreleme (Pills) */}
              <CategoryPills
                selected={selectedCategory}
                onSelect={setSelectedCategory}
                tasks={activeTasks}
              />

              {/* 3. Görev Listesi */}
              <div className="pt-1">
                <TaskList
                  tasks={filteredActiveTasks}
                  type="active"
                  filteredCategoryName={
                    selectedCategory !== 'all'
                      ? CATEGORY_CONFIG[selectedCategory].label
                      : undefined
                  }
                  onToggle={(id) => void toggleTask(id)}
                  onDelete={(id) => void deleteTask(id)}
                  onSnooze={(id, mode) => void snoozeTask(id, mode)}
                  onFocus={(task) => setFocusedTask(task)}
                />
              </div>
            </div>
          )}

          {/* ─── TAMAMLANANLAR SEKMESİ ─── */}
          {activeTab === 'completed' && (
            <div className="pt-1">
              <TaskList
                tasks={completedTasks}
                archivedTasks={archivedTasks}
                type="completed"
                onToggle={(id) => void toggleTask(id)}
                onDelete={(id) => void deleteTask(id)}
                onClearCompleted={() => void clearCompleted()}
                onRestoreCompleted={() => void restoreCompleted()}
                onArchiveCompleted={() => void archiveCompleted()}
                onRestoreFromArchive={(id) => void restoreFromArchive(id)}
                onClearArchive={clearArchive}
              />
            </div>
          )}

          {/* ─── İSTATİSTİKLER SEKMESİ ─── */}
          {activeTab === 'stats' && (
            <div>
              <div
                className="px-5 pb-4"
                style={{
                  paddingTop: 'calc(3rem + env(safe-area-inset-top, 0px))',
                }}
              >
                <p className="text-app-muted text-[11px] font-semibold uppercase tracking-[0.14em]">
                  Performans & Analiz
                </p>
                <div className="flex items-center gap-2.5 mt-1">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--primary-dim)' }}
                  >
                    <BarChart3 size={16} className="text-indigo-400" />
                  </div>
                  <h1 className="text-app-primary text-2xl font-bold tracking-tight">
                    İstatistikler
                  </h1>
                </div>
              </div>

              <StatsView stats={stats} streak={streak} />
            </div>
          )}
        </div>

        {/* ─── Birincil Etkileşim FAB (Detaylı Görev Ekle) ─── */}
        {activeTab === 'tasks' && (
          <button
            onClick={() => setShowForm(true)}
            className="absolute bottom-24 right-5 w-13 h-13 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90 z-20"
            style={{
              background: 'var(--primary)',
              boxShadow:
                '0 10px 28px var(--primary-glow), 0 0 0 1px rgba(255, 255, 255, 0.14)',
            }}
            aria-label="Detaylı görev ekle"
          >
            <Plus size={24} strokeWidth={2.5} className="text-white" />
          </button>
        )}

        {/* ─── Yüzen Alt Navigasyon (Floating Bottom Bar) ─── */}
        <BottomNav
          activeTab={activeTab}
          onTabChange={setActiveTab}
          activeCount={activeTasks.length}
          completedCount={completedTasks.length}
        />
      </div>

      {/* ─── Detaylı Görev Ekleme Modalı ─── */}
      {showForm && (
        <TaskForm
          onAdd={(data) => {
            void addTask(data);
          }}
          onClose={() => setShowForm(false)}
          isSubmitting={isSubmitting}
        />
      )}

      {/* ─── Tek Göreve Odaklanma Modu (Focus / Pomodoro Mini) ─── */}
      {focusedTask && (
        <FocusModal
          task={focusedTask}
          onComplete={(id) => void toggleTask(id)}
          onClose={() => setFocusedTask(null)}
        />
      )}

      {/* ─── Profil, Ayarlar & Geliştirici Menüsü Modalı ─── */}
      {showSettings && (
        <SettingsModal
          userEmail={user?.email ?? ''}
          theme={theme}
          onToggleTheme={toggleTheme}
          streak={streak}
          notifPermission={permission}
          notifStatus={notifStatus}
          onSubscribeNotif={() => void handleSubscribe()}
          onSignOut={() => void signOut()}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
