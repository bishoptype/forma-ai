import React, { useEffect, useState, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Bot,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Menu,
  MessageCircle,
  MessagesSquare,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import {
  AreaChart,
  Area,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  api,
  initials,
  formatTime,
  type Dashboard,
  type Conversation,
} from "./api";
import { Knowledge, History, SettingsPage, Playground } from "./pages";
import { Badge } from "./components";
import "./styles.css";

const navigation = [
  { id: "dashboard", title: "Обзор", icon: LayoutDashboard },
  { id: "conversations", title: "Диалоги", icon: MessagesSquare },
  { id: "knowledge", title: "База знаний", icon: BookOpen },
  { id: "playground", title: "AI-ассистент", icon: Sparkles },
];
const titles: Record<string, string> = {
  dashboard: "Обзор",
  conversations: "Диалоги",
  knowledge: "База знаний",
  playground: "AI-ассистент",
  settings: "Настройки",
};
export function Logo() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <span />
        <span />
        <span />
      </span>
      forma<span className="brand-ai">AI</span>
    </span>
  );
}
export function App() {
  const [page, setPage] = useState(location.hash.slice(1) || "dashboard");
  const [mobile, setMobile] = useState(false);
  const [toast, setToast] = useState("");
  const [notifications, setNotifications] = useState(false);
  const [help, setHelp] = useState(false);
  const [company, setCompany] = useState("NORD HOME");
  const [search, setSearch] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notify = (text: string) => {
    setToast(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(""), 4500);
  };
  useEffect(() => {
    const listener = () => setPage(location.hash.slice(1) || "dashboard");
    window.addEventListener("hashchange", listener);
    api<{ company: string }>("/settings")
      .then((x) => setCompany(x.company))
      .catch(() => {});
    return () => window.removeEventListener("hashchange", listener);
  }, []);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);
  const go = (value: string) => {
    location.hash = value;
    setPage(value);
    setMobile(false);
  };
  if (page === "welcome") return <Landing go={go} />;
  return (
    <div className="app-shell">
      {mobile && (
        <button
          className="sidebar-backdrop"
          aria-label="Закрыть меню"
          onClick={() => setMobile(false)}
        />
      )}
      <aside className={"sidebar " + (mobile ? "mobile-open" : "")}>
        <a href="#welcome" title="Главная страница Forma AI">
          <Logo />
        </a>
        <button className="workspace" onClick={() => go("settings")}>
          <span className="workspace-icon">
            N<span>↗</span>
          </span>
          <span>
            <strong>{company}</strong>
            <small>Рабочее пространство</small>
          </span>
          <ChevronDown size={14} />
        </button>
        <div className="nav-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
        <nav>
          {navigation.map((n) => (
            <a
              key={n.id}
              href={"#" + n.id}
              onClick={() => setMobile(false)}
              className={page === n.id ? "active" : ""}
              aria-current={page === n.id ? "page" : undefined}
            >
              <n.icon size={19} />
              {n.title}
              {n.id === "conversations" && <span className="nav-pill">AI</span>}
              {n.id === "playground" && <span className="nav-new">NEW</span>}
            </a>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="plan-card">
            <div>
              <span className="plan-icon">
                <Zap size={16} />
              </span>
              <strong>
                Меньше рутины.
                <br />
                Больше возможностей.
              </strong>
            </div>
            <p>
              Ваш AI на связи круглосуточно.
              <br />
              Посмотрите, как это работает.
            </p>
            <button onClick={() => go("playground")}>
              Попробовать ассистента <ArrowUpRight size={15} />
            </button>
          </div>
          <button
            className={"nav-bottom " + (page === "settings" ? "selected" : "")}
            onClick={() => go("settings")}
          >
            <Settings2 size={19} />
            Настройки
          </button>
          <button className="nav-bottom" onClick={() => setHelp(true)}>
            <CircleHelp size={19} />
            Помощь и поддержка <ExternalLink size={13} />
          </button>
          <button className="profile" onClick={() => go("settings")}>
            <span className="avatar profile-avatar">АК</span>
            <span>
              <strong>Александра К.</strong>
              <small>Администратор</small>
            </span>
            <ChevronDown size={14} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-btn menu-btn"
              aria-label="Открыть меню"
              onClick={() => setMobile(true)}
            >
              <Menu size={20} />
            </button>
            <span>Рабочее пространство</span>
            <ChevronRight size={14} />
            <strong>{titles[page] || "Обзор"}</strong>
          </div>
          <div className="topbar-actions">
            <form
              className="global-search"
              onSubmit={(e) => {
                e.preventDefault();
                go("conversations");
              }}
            >
              <Search size={16} />
              <input
                aria-label="Поиск диалогов"
                placeholder="Найти диалог…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>↵</kbd>
            </form>
            <span className="demo-label">Демо-пространство</span>
            <button
              className="icon-btn notification-btn"
              aria-label="Уведомления"
              aria-expanded={notifications}
              onClick={() => setNotifications(!notifications)}
            >
              <Bell size={19} />
              <i />
            </button>
            <span className="avatar top-avatar">АК</span>
          </div>
        </header>
        {notifications && (
          <div className="notification-panel">
            <strong>Вы в курсе всего</strong>
            <p>
              <CheckCheck size={17} />
              База знаний проиндексирована
            </p>
            <p>
              <Bot size={17} />
              Демонстрационный ассистент готов
            </p>
            <small>В демо уведомления не отправляются клиентам.</small>
          </div>
        )}
        <main key={page} className="content">
          {page === "dashboard" && <Overview go={go} notify={notify} />}
          {page === "knowledge" && <Knowledge notify={notify} />}
          {page === "conversations" && (
            <History notify={notify} initialSearch={search} />
          )}
          {page === "playground" && <Playground />}
          {page === "settings" && (
            <SettingsPage notify={notify} onCompany={setCompany} />
          )}
          {!titles[page] && (
            <div className="error-state">
              Страница не найдена.{" "}
              <button className="btn" onClick={() => go("dashboard")}>
                Перейти к обзору
              </button>
            </div>
          )}
        </main>
        <footer className="app-footer">
          <span>
            <i className="green-dot" />
            Создано для спокойной поддержки
          </span>
          <span>
            Forma AI <span className="footer-dot">·</span> Portfolio demo 2026
          </span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button aria-label="Закрыть уведомление" onClick={() => setToast("")}>
            <X size={16} />
          </button>
        </div>
      )}
      {help && <HelpModal onClose={() => setHelp(false)} />}
    </div>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby="help-title"
      onCancel={onClose}
    >
      <button
        className="modal-close icon-btn"
        autoFocus
        onClick={onClose}
        aria-label="Закрыть"
      >
        <X size={20} />
      </button>
      <div className="feature-icon">
        <CircleHelp />
      </div>
      <h2 id="help-title">Знакомство с Forma AI</h2>
      <p>1. Добавьте FAQ или PDF в базу знаний.</p>
      <p>2. Задайте вопрос в разделе «AI-ассистент».</p>
      <p>3. Откройте диалог и посмотрите источники ответа.</p>
      <p>4. Подключите своего бота в настройках.</p>
      <a
        className="btn primary"
        href="/api/health"
        target="_blank"
        rel="noreferrer"
      >
        Проверить состояние API <ExternalLink size={16} />
      </a>
      <p className="muted">
        Инструкции по запуску и архитектуре — в README проекта.
      </p>
    </dialog>
  );
}
function Overview({
  go,
  notify,
}: {
  go: (p: string) => void;
  notify: (t: string) => void;
}) {
  const [data, setData] = useState<Dashboard | null>(null);
  const [days, setDays] = useState(7);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = () => {
      api<Dashboard>("/dashboard?days=" + days)
        .then((x) => {
          if (active) {
            setData(x);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    };
    refresh();
    const interval = setInterval(refresh, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [days]);
  function exportReport() {
    if (!data) return;
    const csv =
      "\uFEFFДата;Все диалоги;Решены AI\n" +
      data.series.map((r) => `${r.date};${r.total};${r.resolved}`).join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "forma-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
    notify("Отчёт сохранён в CSV");
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">
            <span className="green-dot" /> ВАША ПОДДЕРЖКА ПОД КОНТРОЛЕМ
          </div>
          <h1>
            Всё начинается с диалога<span className="purple-text">.</span>
          </h1>
          <p>Пока вы развиваете бизнес, Forma заботится о ваших клиентах.</p>
        </div>
        <div className="heading-actions">
          <label className="select-wrap">
            <Clock3 size={15} />
            <select
              aria-label="Период аналитики"
              value={days}
              onChange={(e) => setDays(+e.target.value)}
            >
              <option value={7}>Последние 7 дней</option>
              <option value={14}>Последние 14 дней</option>
              <option value={30}>Последние 30 дней</option>
            </select>
          </label>
          <button className="btn" onClick={exportReport} disabled={!data}>
            <ArrowDownToLine size={16} />
            Экспорт
          </button>
        </div>
      </div>
      <div className="welcome-banner">
        <div className="banner-symbol">
          <Sparkles size={27} />
        </div>
        <div>
          <strong>Хорошая поддержка не уходит офлайн</strong>
          <p>
            Ваш AI-ассистент отвечает на вопросы, находит решения и освобождает
            время команды.
          </p>
        </div>
        <button onClick={() => go("playground")}>
          Проверить ассистента <ArrowRight size={16} />
        </button>
        <div className="banner-orbit" />
      </div>
      {error ? (
        <div className="error-state">
          <strong>Не удалось загрузить аналитику</strong>
          <p>{error}</p>
          <p>Запустите backend или укажите API-ключ в настройках.</p>
          <button className="btn" onClick={() => go("settings")}>
            Настройки доступа
          </button>
        </div>
      ) : !data ? (
        <div className="loading-grid">
          {[1, 2, 3, 4].map((i) => (
            <div className="skeleton" key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="stats-grid">
            <Metric
              icon={MessagesSquare}
              label="Всего диалогов"
              value={data.total.toLocaleString("ru")}
              trend={
                data.growth === null
                  ? "Новый период"
                  : `${data.growth >= 0 ? "+" : ""}${data.growth}%`
              }
              detail="к предыдущему периоду"
              color="purple"
              spark="9,30 24,24 37,27 50,14 62,18 77,7 91,12 108,2"
            />
            <Metric
              icon={ShieldCheck}
              label="Решено ассистентом"
              value={data.resolved.toLocaleString("ru")}
              trend={`${data.rate}%`}
              detail="от всех обращений"
              color="green"
              spark="9,31 25,28 39,17 53,20 67,9 80,15 93,4 108,6"
            />
            <Metric
              icon={Clock3}
              label="Среднее время ответа"
              value={String(data.response).replace(".", ",")}
              unit="сек"
              trend="Мгновенно"
              detail="без ожидания оператора"
              color="orange"
              spark="9,5 24,13 37,7 50,22 62,15 77,26 91,24 108,31"
            />
            <Metric
              icon={Zap}
              label="Время для вашей команды"
              value={String(data.saved_hours).replace(".", ",")}
              unit="ч"
              trend="≈ 4 мин"
              detail="экономии на обращение"
              color="blue"
              spark="9,31 24,28 37,28 50,18 62,21 77,12 91,14 108,2"
            />
          </div>
          <div className="analytics-grid">
            <section className="card activity-card">
              <div className="card-heading">
                <div>
                  <h2>
                    Активность диалогов{" "}
                    <span className="subtle-pill">{days} дней</span>
                  </h2>
                  <p>Каждый вопрос — возможность помочь</p>
                </div>
                <div className="chart-legend">
                  <span>
                    <i />
                    Все диалоги
                  </span>
                  <span>
                    <i />
                    Решено AI
                  </span>
                </div>
              </div>
              <div
                className="activity-chart"
                role="img"
                aria-label={`График за ${days} дней: ${data.total} диалогов, ${data.resolved} решено AI`}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.series}
                    margin={{ top: 14, right: 12, left: -23, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="totalFill"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="#8c75de"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="100%"
                          stopColor="#8c75de"
                          stopOpacity={0.015}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="4 5"
                      stroke="#eeedf3"
                    />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#858392" }}
                      dy={10}
                      minTickGap={20}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "#858392" }}
                    />
                    <Tooltip
                      contentStyle={{
                        border: "1px solid #edeaf5",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                    />
                    <Area
                      name="Все диалоги"
                      type="monotone"
                      dataKey="total"
                      stroke="#8a70d8"
                      strokeWidth={2.5}
                      fill="url(#totalFill)"
                    />
                    <Area
                      name="Решено AI"
                      type="monotone"
                      dataKey="resolved"
                      stroke="#7fbfa9"
                      strokeWidth={2}
                      strokeDasharray="5 4"
                      fill="transparent"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-foot">
                <span>
                  <Sparkles size={14} />
                  Меньше ожидания. Больше довольных клиентов.
                </span>
                <span>Обновлено только что</span>
              </div>
            </section>
            <section className="card topics-card">
              <div className="card-heading">
                <div>
                  <h2>О чём спрашивают</h2>
                  <p>Популярные темы обращений</p>
                </div>
                <MessageCircle size={19} className="muted" />
              </div>
              <div className="topic-list">
                {data.topics.map((t, i) => (
                  <div className="topic" key={t.name}>
                    <div>
                      <span>
                        <span className="topic-number">0{i + 1}</span>
                        {t.name}
                      </span>
                      <strong>
                        {Math.round((t.count / Math.max(data.total, 1)) * 100)}
                        <small>%</small>
                      </strong>
                    </div>
                    <div className="topic-track">
                      <i
                        style={{
                          width: `${(t.count / Math.max(data.total, 1)) * 100}%`,
                          background: [
                            "#8c76d9",
                            "#b3a0e7",
                            "#cec1ef",
                            "#ded5f4",
                            "#e8e3f3",
                          ][i],
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <button
                className="text-link topic-link"
                onClick={() => go("knowledge")}
              >
                Улучшить базу знаний <ArrowUpRight size={15} />
              </button>
            </section>
          </div>
          <div className="bottom-grid">
            <section className="card recent-card">
              <div className="card-heading">
                <div>
                  <h2>
                    Последние диалоги{" "}
                    <span className="live-pill">
                      <i />
                      Live
                    </span>
                  </h2>
                  <p>За каждым сообщением — человек</p>
                </div>
                <button
                  className="text-link"
                  onClick={() => go("conversations")}
                >
                  Все диалоги <ArrowRight size={14} />
                </button>
              </div>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>КЛИЕНТ</th>
                      <th>ПОСЛЕДНЕЕ СООБЩЕНИЕ</th>
                      <th>СТАТУС</th>
                      <th>ВРЕМЯ</th>
                      <th>
                        <span className="sr-only">Действия</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((c, i) => (
                      <tr key={c.id}>
                        <td>
                          <div className="table-person">
                            <span className={"avatar av-" + i}>
                              {initials(c.name)}
                            </span>
                            <span>
                              <strong>{c.name}</strong>
                              <small>
                                <Send size={9} /> Telegram
                              </small>
                            </span>
                          </div>
                        </td>
                        <td className="message-cell">
                          {
                            c.messages.filter((m) => m.role === "user").at(-1)
                              ?.text
                          }
                        </td>
                        <td>
                          <Badge status={c.status} />
                        </td>
                        <td className="time-cell">
                          {formatTime(c.created_at)}
                        </td>
                        <td>
                          <button
                            className="icon-btn"
                            aria-label={"Открыть диалог " + c.name}
                            onClick={() => {
                              sessionStorage.setItem(
                                "forma-conversation",
                                c.id,
                              );
                              go("conversations");
                            }}
                          >
                            <ChevronRight size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
            <section className="assistant-card">
              <div className="assistant-top">
                <span className="assistant-symbol">
                  <Sparkles size={22} />
                </span>
                <span className="assistant-status">
                  <i />
                  Готов к работе
                </span>
              </div>
              <h2>
                Ваш лучший сотрудник.
                <br />
                <span>Всегда на связи.</span>
              </h2>
              <p>
                Знает ваш бизнес. Говорит вашим
                <br />
                языком. Помогает вашим клиентам.
              </p>
              <div className="assistant-detail">
                <BookOpen size={15} />
                <span>{data.documents} источников знаний</span>
                <Check size={14} />
              </div>
              <div className="assistant-detail">
                <Send size={15} />
                <span>Telegram-симулятор</span>
                <Check size={14} />
              </div>
              <button className="btn primary" onClick={() => go("playground")}>
                <Sparkles size={16} />
                Начать тестовый диалог
                <ArrowUpRight size={16} />
              </button>
              <div className="assistant-caption">
                Почувствуйте себя вашим клиентом
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  unit,
  trend,
  detail,
  color,
  spark,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  unit?: string;
  trend: string;
  detail: string;
  color: string;
  spark: string;
}) {
  return (
    <section className="card metric">
      <div className="metric-label">
        <span>{label}</span>
        <span className={"metric-icon " + color}>
          <Icon size={17} />
        </span>
      </div>
      <div className="metric-main">
        <strong>
          {value}
          <span>{unit}</span>
        </strong>
        <svg
          viewBox="0 0 118 40"
          className={"sparkline " + color}
          aria-hidden="true"
        >
          <polyline
            points={spark}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="metric-meta">
        <span>
          <ArrowUpRight size={12} />
          {trend}
        </span>
        <small>{detail}</small>
      </div>
    </section>
  );
}

function Landing({ go }: { go: (s: string) => void }) {
  return (
    <div className="landing">
      <header>
        <Logo />
        <nav>
          <a
            href="#welcome"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("features")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Возможности
          </a>
          <a
            href="#welcome"
            onClick={(e) => {
              e.preventDefault();
              document
                .getElementById("how")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Как это работает
          </a>
          <button className="btn" onClick={() => go("dashboard")}>
            Войти в демо <ArrowUpRight size={16} />
          </button>
        </nav>
      </header>
      <main>
        <div className="landing-hero">
          <div className="hero-copy">
            <span className="hero-tag">
              <Sparkles size={15} />
              Поддержка с человеческим подходом
            </span>
            <h1>
              Ваши клиенты
              <br />
              не любят ждать.
              <br />
              <span>Теперь им не нужно.</span>
            </h1>
            <p>
              Превратите знания вашей компании в AI-ассистента, который отвечает
              в Telegram, помогает с заказами и оставляет команде время на
              главное.
            </p>
            <div className="hero-cta">
              <button className="btn primary" onClick={() => go("dashboard")}>
                Посмотреть демо <ArrowRight size={17} />
              </button>
              <button className="btn" onClick={() => go("playground")}>
                <Send size={16} />
                Написать ассистенту
              </button>
            </div>
            <div className="hero-note">
              <Check size={15} />
              Без регистрации <span>·</span>
              <Check size={15} />С реальными сценариями
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-note">
              <ShieldCheck size={21} />
              <span>
                <strong>Вопрос решён</strong>
                <small>А команда занимается важным</small>
              </span>
            </div>
            <div className="hero-chat">
              <div className="hero-chat-head">
                <span className="assistant-symbol">
                  <Sparkles />
                </span>
                <span>
                  <strong>NORD HOME</strong>
                  <small>
                    <i className="green-dot" />
                    AI-ассистент в сети
                  </small>
                </span>
                <Send size={21} />
              </div>
              <div className="chat-date">Сегодня</div>
              <div className="chat-bubble user">
                Сколько стоит доставка?
                <small>
                  12:41 <CheckCheck size={12} />
                </small>
              </div>
              <div className="chat-bubble assistant">
                Стоимость доставки зависит от города. Москва от 500 рублей.
                <br />
                <br />А при заказе от 10 000 рублей доставим бесплатно!
                <small>12:41</small>
              </div>
              <div className="source-chip">
                <BookOpen size={12} />
                Доставка и самовывоз
              </div>
              <div className="chat-bubble user">
                Хочу оформить заказ
                <small>
                  12:42 <CheckCheck size={12} />
                </small>
              </div>
              <div className="chat-bubble assistant">
                Создал заявку. Менеджер получил уведомление.<small>12:42</small>
              </div>
              <div className="hero-chat-input">
                Напишите сообщение…
                <Send size={17} />
              </div>
            </div>
            <div className="floating-speed">
              <Zap size={18} />
              <strong>1,2 сек</strong>
              <span>и ответ уже у клиента</span>
            </div>
          </div>
        </div>
        <section id="features" className="landing-features">
          <div className="landing-section-title">
            <span className="eyebrow">ОДНА ПЛАТФОРМА. ВСЯ ПОДДЕРЖКА.</span>
            <h2>
              Сложные технологии.
              <br />
              Простой рабочий день.
            </h2>
          </div>
          {[
            {
              icon: BookOpen,
              title: "Знает ваш бизнес",
              text: "PDF, FAQ и страницы сайта превращаются в базу знаний. Каждый ответ опирается на ваши материалы.",
            },
            {
              icon: MessageCircle,
              title: "Рядом с клиентами",
              text: "Отвечает на вопросы в Telegram и передаёт сложные обращения менеджеру вместе с контекстом.",
            },
            {
              icon: LayoutDashboard,
              title: "Результат на виду",
              text: "Следите за диалогами, скоростью ответов и популярными вопросами в одном понятном дашборде.",
            },
          ].map((f) => (
            <div className="landing-feature" key={f.title}>
              <span className="feature-icon">
                <f.icon />
              </span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </section>
        <section id="how" className="landing-how">
          <h2>От знаний к заботе — за три шага</h2>
          <div>
            {[
              "Добавьте знания компании",
              "Настройте голос ассистента",
              "Подключите Telegram",
            ].map((t, i) => (
              <p key={t}>
                <span>0{i + 1}</span>
                {t}
              </p>
            ))}
          </div>
          <button className="btn primary" onClick={() => go("dashboard")}>
            Открыть рабочее пространство <ArrowRight size={17} />
          </button>
        </section>
      </main>
      <footer>
        <Logo />
        <span>Демонстрационный SaaS-проект · 2026</span>
        <a href="#dashboard">Попробовать Forma AI ↗</a>
      </footer>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
