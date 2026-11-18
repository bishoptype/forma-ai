import { useEffect, useState, useRef, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bot,
  Check,
  CheckCheck,
  ChevronRight,
  FileText,
  Globe,
  Link,
  LoaderCircle,
  MessageCircle,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import {
  api,
  initials,
  formatTime,
  type Doc,
  type Conversation,
  type Company,
  type Message,
} from "./api";
import { Badge } from "./components";

type Notify = { notify: (s: string) => void };
function ErrorNote({ text }: { text: string }) {
  return text ? (
    <div className="inline-error" role="alert">
      {text}
    </div>
  ) : null;
}
function Heading({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow: string;
  title: string;
  text: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>
          {title}
          <span className="purple-text">.</span>
        </h1>
        <p>{text}</p>
      </div>
      {children}
    </div>
  );
}

export function Knowledge({ notify }: Notify) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [error, setError] = useState("");
  const [modal, setModal] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Doc | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const load = () =>
    api<Doc[]>("/documents")
      .then(setDocs)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  useEffect(() => {
    if (modal || pendingDelete) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [modal, pendingDelete]);
  function close() {
    if (!busy) {
      setModal("");
      setPendingDelete(null);
      setError("");
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await api("/documents", {
        method: "POST",
        body: JSON.stringify({
          title: form.get("title"),
          content: form.get("content") || "",
          url: form.get("url") || "",
        }),
      });
      await load();
      setModal("");
      notify("Источник добавлен и проиндексирован");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      await api("/documents/upload", { method: "POST", body });
      await load();
      notify("PDF загружен. Ассистент уже использует новые знания");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }
  async function remove() {
    if (!pendingDelete) return;
    setBusy(true);
    try {
      await api("/documents/" + pendingDelete.id, { method: "DELETE" });
      await load();
      setPendingDelete(null);
      notify("Источник удалён из базы знаний");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const filtered = docs.filter((d) =>
    d.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <Heading
        eyebrow="ОСНОВА ХОРОШИХ ОТВЕТОВ"
        title="Знания, которые помогают"
        text="Расскажите ассистенту о вашем бизнесе. Он позаботится об остальном."
      >
        <button className="btn primary" onClick={() => setModal("faq")}>
          <Plus size={17} />
          Добавить знания
        </button>
      </Heading>
      <div className="knowledge-actions">
        <button
          className="knowledge-action"
          disabled={busy}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            if (!busy) upload(e.dataTransfer.files[0]);
          }}
        >
          <span className="feature-icon">
            {busy ? <LoaderCircle className="spin" /> : <UploadCloud />}
          </span>
          <strong>Загрузить документ</strong>
          <span>Перетащите PDF или выберите файл</span>
          <small>До 10 МБ · до 200 страниц</small>
          <ArrowUpRight className="action-arrow" size={19} />
        </button>
        <button className="knowledge-action" onClick={() => setModal("faq")}>
          <span className="feature-icon mint">
            <MessageCircle />
          </span>
          <strong>Добавить вопрос и ответ</strong>
          <span>Точные ответы на частые вопросы</span>
          <small>FAQ · текстовые материалы</small>
          <Plus className="action-arrow" size={19} />
        </button>
        <button className="knowledge-action" onClick={() => setModal("url")}>
          <span className="feature-icon peach">
            <Globe />
          </span>
          <strong>Импортировать с сайта</strong>
          <span>Используйте знания с вашей страницы</span>
          <small>Публичная HTTPS-страница</small>
          <Link className="action-arrow" size={19} />
        </button>
      </div>
      <input
        hidden
        ref={fileRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {!modal && !pendingDelete && <ErrorNote text={error} />}
      <section className="card knowledge-list">
        <div className="card-heading">
          <div>
            <h2>
              Источники знаний{" "}
              <span className="subtle-pill">{docs.length}</span>
            </h2>
            <p>Актуальная информация для уверенных ответов</p>
          </div>
          <label className="search-field">
            <Search size={16} />
            <input
              aria-label="Поиск источников"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Найти источник…"
            />
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>ИСТОЧНИК</th>
                <th>ТИП</th>
                <th>ОБЪЁМ</th>
                <th>СТАТУС</th>
                <th>ДОБАВЛЕН</th>
                <th>
                  <span className="sr-only">Действия</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id}>
                  <td>
                    <div className="document-name">
                      <span className={"doc-icon " + d.kind}>
                        {d.kind === "pdf" ? (
                          <FileText size={20} />
                        ) : d.kind === "url" ? (
                          <Globe size={20} />
                        ) : (
                          <MessageCircle size={20} />
                        )}
                      </span>
                      <div>
                        <strong>{d.title}</strong>
                        <small>{d.source}</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="type-tag">{d.kind.toUpperCase()}</span>
                  </td>
                  <td className="muted">
                    {d.chunks} фрагм. · {(d.characters / 1000).toFixed(1)} тыс.
                    симв.
                  </td>
                  <td>
                    <Badge status={d.status} />
                  </td>
                  <td className="muted">
                    {new Date(d.created_at).toLocaleDateString("ru-RU")}
                  </td>
                  <td>
                    <button
                      className="icon-btn delete-btn"
                      aria-label={"Удалить " + d.title}
                      onClick={() => setPendingDelete(d)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!filtered.length && (
          <div className="empty-state">
            <BookOpen size={30} />
            <h3>
              {query
                ? "Ничего не найдено"
                : "Здесь будут знания вашей компании"}
            </h3>
            <p>
              {query
                ? "Попробуйте другой запрос"
                : "Добавьте PDF, FAQ или страницу сайта, чтобы начать."}
            </p>
          </div>
        )}
        <div className="knowledge-footer">
          <ShieldCheck size={16} />
          Ответы опираются на ваши материалы. Источники можно проверить в каждом
          диалоге.
        </div>
      </section>
      <div className="tip-card">
        <Sparkles size={23} />
        <div>
          <strong>Хороший ответ начинается с хорошего источника</strong>
          <p>
            Укажите точные цены, условия доставки и возврата. Чем конкретнее
            информация, тем полезнее ассистент.
          </p>
        </div>
      </div>
      <dialog
        ref={dialogRef}
        className="modal"
        onCancel={(e) => {
          if (busy) e.preventDefault();
          else close();
        }}
      >
        <button
          className="modal-close icon-btn"
          disabled={busy}
          onClick={close}
          aria-label="Закрыть"
        >
          <X size={20} />
        </button>
        {pendingDelete ? (
          <>
            <div className="feature-icon peach">
              <Trash2 />
            </div>
            <h2>Удалить источник?</h2>
            <p>
              «{pendingDelete.title}» больше не будет использоваться для новых
              ответов. История диалогов сохранится.
            </p>
            <ErrorNote text={error} />
            <div className="form-actions">
              <button className="btn" onClick={close}>
                Отмена
              </button>
              <button className="btn danger" disabled={busy} onClick={remove}>
                Удалить источник
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <div className="feature-icon">
              {modal === "url" ? <Globe /> : <MessageCircle />}
            </div>
            <h2>
              {modal === "url"
                ? "Добавить страницу сайта"
                : "Добавить вопрос и ответ"}
            </h2>
            <p>После индексации материал станет доступен ассистенту.</p>
            <label>
              Название источника
              <input
                name="title"
                minLength={2}
                maxLength={160}
                required
                placeholder={
                  modal === "url"
                    ? "Условия доставки"
                    : "Можно ли оплатить по СБП?"
                }
              />
            </label>
            {modal === "url" ? (
              <label>
                Адрес страницы
                <input
                  name="url"
                  type="url"
                  required
                  placeholder="https://example.com/delivery"
                />
              </label>
            ) : (
              <label>
                Ответ или текст материала
                <textarea
                  name="content"
                  minLength={10}
                  required
                  rows={6}
                  placeholder="Да, вы можете оплатить заказ через СБП. Выберите этот способ на странице оплаты…"
                />
              </label>
            )}
            <ErrorNote text={error} />
            <div className="form-actions">
              <button
                type="button"
                className="btn"
                onClick={close}
                disabled={busy}
              >
                Отмена
              </button>
              <button className="btn primary" disabled={busy}>
                {busy ? (
                  <LoaderCircle className="spin" size={16} />
                ) : (
                  <Plus size={16} />
                )}{" "}
                {busy ? "Индексируем…" : "Добавить источник"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </>
  );
}

export function History({
  notify,
  initialSearch,
}: Notify & { initialSearch: string }) {
  const [rows, setRows] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<Conversation | null>(null);
  const [query, setQuery] = useState(initialSearch);
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setLoading(true);
      api<Conversation[]>(
        "/conversations?q=" + encodeURIComponent(query) + "&status=" + status,
        { signal: controller.signal },
      )
        .then((list) => {
          setRows(list);
          const id = sessionStorage.getItem("forma-conversation");
          setSelected(
            (current) =>
              list.find((c) => c.id === (id || current?.id)) || list[0] || null,
          );
          sessionStorage.removeItem("forma-conversation");
          setError("");
        })
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }, 200);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query, status]);
  useEffect(() => {
    setQuery(initialSearch);
  }, [initialSearch]);
  async function resolve() {
    if (!selected) return;
    try {
      const c = await api<Conversation>(
        "/conversations/" + selected.id + "/resolve",
        { method: "PATCH" },
      );
      setSelected(c);
      setRows(rows.map((r) => (r.id === c.id ? c : r)));
      notify("Диалог отмечен решённым");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <>
      <Heading
        eyebrow="КАЖДЫЙ КЛИЕНТ УСЛЫШАН"
        title="Диалоги с продолжением"
        text="Весь контекст, ответы ассистента и обращения к команде — в одном месте."
      />
      <ErrorNote text={error} />
      <section className="card inbox">
        <div className="inbox-list">
          <div className="inbox-tools">
            <label className="search-field">
              <Search size={16} />
              <input
                aria-label="Поиск в истории"
                placeholder="Имя, вопрос или сообщение…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <div className="filter-tabs">
              {[
                { id: "all", label: "Все" },
                { id: "resolved", label: "Решены AI" },
                { id: "handoff", label: "Менеджеру" },
                { id: "open", label: "Открытые" },
                { id: "closed", label: "Командой" },
              ].map((t) => (
                <button
                  key={t.id}
                  className={status === t.id ? "active" : ""}
                  onClick={() => setStatus(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div className="conversation-list">
            {loading ? (
              <div className="empty-state">
                <LoaderCircle className="spin" />
                Загружаем диалоги…
              </div>
            ) : rows.length ? (
              rows.map((c, i) => (
                <button
                  key={c.id}
                  className={
                    "conversation-item " +
                    (selected?.id === c.id ? "selected" : "")
                  }
                  onClick={() => setSelected(c)}
                >
                  <span className={"avatar av-" + (i % 5)}>
                    {initials(c.name)}
                  </span>
                  <span className="conversation-preview">
                    <span>
                      <strong>{c.name}</strong>
                      <small>{formatTime(c.created_at)}</small>
                    </span>
                    <p>
                      {c.messages.filter((m) => m.role === "user").at(-1)?.text}
                    </p>
                    <Badge status={c.status} />
                  </span>
                </button>
              ))
            ) : (
              <div className="empty-state">
                <MessagesIcon />
                <h3>Диалогов не найдено</h3>
                <p>Измените запрос или фильтр.</p>
              </div>
            )}
          </div>
          <div className="inbox-count">
            Показано {rows.length} последних диалогов
          </div>
        </div>
        <div className="inbox-detail">
          {selected ? (
            <>
              <div className="conversation-header">
                <div className="table-person">
                  <span className="avatar av-0">{initials(selected.name)}</span>
                  <div>
                    <strong>{selected.name}</strong>
                    <small>{selected.handle} · Telegram</small>
                  </div>
                </div>
                <Badge status={selected.status} />
              </div>
              <div className="history-messages">
                <div className="chat-date">
                  {new Date(selected.created_at).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                  })}
                </div>
                {selected.messages.map((m, i) => (
                  <div key={i} className={"history-message " + m.role}>
                    {m.role === "assistant" && (
                      <div className="ai-author">
                        <Sparkles size={13} />
                        Forma AI
                      </div>
                    )}
                    <div className={"chat-bubble " + m.role}>
                      {m.text}
                      <small>
                        {m.time ? formatTime(m.time) : ""}
                        {m.role === "user" && <CheckCheck size={13} />}
                      </small>
                    </div>
                    {m.sources?.map((s) => (
                      <span key={s} className="source-chip">
                        <BookOpen size={11} />
                        {s}
                      </span>
                    ))}
                    {m.lead_id && (
                      <span className="source-chip">
                        <Check size={12} />
                        Заявка {m.lead_id}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div className="conversation-summary">
                <div>
                  <ShieldCheck size={18} />
                  <span>
                    <strong>
                      {["resolved", "closed"].includes(selected.status)
                        ? "Вопрос решён"
                        : "Обращение требует внимания"}
                    </strong>
                    <small>
                      Время ответа: {selected.response_seconds} сек ·{" "}
                      {selected.topic}
                    </small>
                  </span>
                </div>
                {!["resolved", "closed"].includes(selected.status) && (
                  <button className="btn" onClick={resolve}>
                    <Check size={15} />
                    Решено
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="empty-state">
              <MessagesIcon />
              <h3>Выберите диалог</h3>
              <p>Здесь появятся сообщения и источники ответов.</p>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
function MessagesIcon() {
  return <MessageCircle size={30} />;
}

export function Playground() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [id, setId] = useState<string>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [company, setCompany] = useState<Company>();
  const [engine, setEngine] = useState("");
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => {
    api<Company>("/settings")
      .then((c) => {
        setCompany(c);
        setMessages([{ role: "assistant", text: c.greeting }]);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, busy]);
  async function send(value = text) {
    if (!value.trim() || busy) return;
    setError("");
    setBusy(true);
    const question = value.trim();
    setText("");
    try {
      const response = await api<{
        answer: string;
        conversation_id: string;
        sources: string[];
        lead_id?: string;
        engine: string;
      }>("/chat", {
        method: "POST",
        body: JSON.stringify({ message: question, conversation_id: id }),
      });
      setId(response.conversation_id);
      setEngine(response.engine);
      setMessages((m) => [
        ...m,
        { role: "user", text: question, time: new Date().toISOString() },
        {
          role: "assistant",
          text: response.answer,
          sources: response.sources,
          lead_id: response.lead_id,
          time: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      setText(question);
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="ПОДДЕРЖКА ГЛАЗАМИ КЛИЕНТА"
        title="Познакомьтесь с вашим AI"
        text="Протестируйте ответы на реальных вопросах, прежде чем подключать Telegram."
      >
        <button
          className="btn"
          disabled={busy}
          onClick={() => {
            setMessages([
              {
                role: "assistant",
                text: company?.greeting || "Здравствуйте! Чем могу помочь?",
              },
            ]);
            setId(undefined);
            setError("");
          }}
        >
          <RefreshCw size={16} />
          Новый диалог
        </button>
      </Heading>
      <div className="playground-grid">
        <section className="playground-info">
          <span className="hero-tag">
            <Send size={14} />
            Telegram-симулятор
          </span>
          <h2>
            Один вопрос.
            <br />
            <span>И всё становится проще.</span>
          </h2>
          <p>
            Ассистент использует вашу базу знаний. Попробуйте узнать о доставке,
            вернуть товар или оформить заказ.
          </p>
          <div className="scenario-list">
            <strong>ПОПРОБУЙТЕ СЦЕНАРИЙ</strong>
            {[
              "Сколько стоит доставка?",
              "Хочу оформить заказ",
              "Как вернуть товар?",
              "Есть ли в наличии светильник Luna?",
            ].map((q, i) => (
              <button disabled={busy} key={q} onClick={() => send(q)}>
                <span>0{i + 1}</span>
                {q}
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
          <div className="playground-note">
            <ShieldCheck size={20} />
            <div>
              <strong>Безопасное демо</strong>
              <p>
                Тестовые заявки сохраняются в истории. Уведомления реальным
                менеджерам не отправляются.
              </p>
            </div>
          </div>
          <div className="engine-label">
            <i className="green-dot" />
            {company?.llm_connected
              ? "LLM API подключён"
              : "Локальный RAG · без API-ключей"}
            {engine && (
              <span>
                {" "}
                · {engine === "llm" ? "Ответ LLM" : "Поиск по материалам"}
              </span>
            )}
          </div>
        </section>
        <section className="telegram-window">
          <div className="telegram-header">
            <span className="assistant-symbol">
              <Sparkles size={24} />
            </span>
            <div>
              <strong>{company?.company || "NORD HOME"}</strong>
              <small>бот · AI-ассистент</small>
            </div>
            <Send size={22} />
          </div>
          <div className="telegram-messages" aria-live="polite">
            <div className="chat-date">Сегодня</div>
            {messages.map((m, i) => (
              <div className={"history-message " + m.role} key={i}>
                <div className={"chat-bubble " + m.role}>
                  {m.text}
                  <small>
                    {m.time ? formatTime(m.time) : "Сейчас"}
                    {m.role === "user" && <CheckCheck size={13} />}
                  </small>
                </div>
                {m.sources?.map((s) => (
                  <span className="source-chip" key={s}>
                    <BookOpen size={11} />
                    {s}
                  </span>
                ))}
                {m.lead_id && (
                  <div className="lead-confirmation">
                    <CheckCheck size={17} />
                    <span>
                      <strong>Заявка {m.lead_id}</strong>
                      <small>Демо · передана в очередь менеджера</small>
                    </span>
                  </div>
                )}
              </div>
            ))}
            {busy && (
              <div className="typing-indicator">
                <span />
                <span />
                <span /> Ассистент ищет ответ…
              </div>
            )}
            <div ref={bottom} />
          </div>
          <ErrorNote text={error} />
          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              aria-label="Сообщение ассистенту"
              value={text}
              maxLength={4000}
              onChange={(e) => setText(e.target.value)}
              placeholder="Напишите сообщение…"
            />
            <button
              disabled={busy || !text.trim()}
              aria-label="Отправить сообщение"
            >
              {busy ? (
                <LoaderCircle size={19} className="spin" />
              ) : (
                <Send size={19} />
              )}
            </button>
          </form>
          <div className="chat-disclaimer">
            Демо-режим · ответы на основе базы знаний компании
          </div>
        </section>
      </div>
    </>
  );
}

export function SettingsPage({
  notify,
  onCompany,
}: Notify & { onCompany: (s: string) => void }) {
  const [config, setConfig] = useState<Company>();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [key, setKey] = useState(sessionStorage.getItem("forma-api-key") || "");
  const load = () =>
    api<Company>("/settings")
      .then(setConfig)
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  async function save(e: FormEvent) {
    e.preventDefault();
    if (!config) return;
    setBusy(true);
    setError("");
    try {
      const result = await api<Company>("/settings", {
        method: "PUT",
        body: JSON.stringify(config),
      });
      setConfig(result);
      onCompany(result.company);
      notify("Настройки сохранены. Ассистент уже использует их");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function connect() {
    setBusy(true);
    setError("");
    try {
      const r = await api<{ username: string }>("/telegram/connect", {
        method: "POST",
      });
      notify("Бот @" + r.username + " подключён");
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Heading
        eyebrow="ВАШ БРЕНД. ВАШ ГОЛОС."
        title="Ассистент с вашим характером"
        text="Настройте пространство, стиль общения и подключение к Telegram."
      />
      <ErrorNote text={error} />
      <div className="settings-grid">
        <form onSubmit={save} className="card settings-card">
          <div className="card-heading">
            <div>
              <h2>
                <Settings2 size={18} />
                Общие настройки
              </h2>
              <p>Как ассистент представляет вашу компанию</p>
            </div>
          </div>
          {config && (
            <div className="settings-fields">
              <label>
                Название компании
                <input
                  value={config.company}
                  minLength={2}
                  maxLength={100}
                  required
                  onChange={(e) =>
                    setConfig({ ...config, company: e.target.value })
                  }
                />
              </label>
              <label>
                Приветственное сообщение
                <textarea
                  rows={3}
                  value={config.greeting}
                  minLength={2}
                  maxLength={500}
                  required
                  onChange={(e) =>
                    setConfig({ ...config, greeting: e.target.value })
                  }
                />
                <small>Первое сообщение в тестовом диалоге</small>
              </label>
              <label>Стиль общения</label>
              <div className="tone-options">
                {[
                  {
                    id: "friendly",
                    name: "Дружелюбный",
                    text: "Тепло и по делу",
                    icon: MessageCircle,
                  },
                  {
                    id: "professional",
                    name: "Деловой",
                    text: "Сдержанно и точно",
                    icon: ShieldCheck,
                  },
                  {
                    id: "brief",
                    name: "Краткий",
                    text: "Только главное",
                    icon: Sparkles,
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={config.tone === t.id ? "selected" : ""}
                    aria-pressed={config.tone === t.id}
                    onClick={() => setConfig({ ...config, tone: t.id })}
                  >
                    <t.icon size={20} />
                    <strong>{t.name}</strong>
                    <small>{t.text}</small>
                    {config.tone === t.id && (
                      <Check size={13} className="tone-check" />
                    )}
                  </button>
                ))}
              </div>
              <label>
                Язык ответов
                <select
                  value={config.language}
                  onChange={(e) =>
                    setConfig({ ...config, language: e.target.value })
                  }
                >
                  <option value="ru">Русский</option>
                  <option value="en">English (полный перевод с LLM API)</option>
                </select>
                <small>
                  Локальный поиск возвращает материалы на языке источника. LLM
                  переводит ответы на выбранный язык.
                </small>
              </label>
              <div className="setting-toggle">
                <div>
                  <strong>Передавать сложные вопросы менеджеру</strong>
                  <small>Создавать заявки по просьбе клиента</small>
                </div>
                <button
                  type="button"
                  className={"switch " + (config.handoff ? "on" : "")}
                  role="switch"
                  aria-checked={config.handoff}
                  aria-label="Передавать менеджеру"
                  onClick={() =>
                    setConfig({ ...config, handoff: !config.handoff })
                  }
                >
                  <span />
                </button>
              </div>
              <div className="form-actions">
                <button disabled={busy} className="btn primary">
                  {busy ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <Check size={16} />
                  )}
                  Сохранить изменения
                </button>
              </div>
            </div>
          )}
        </form>
        <div className="settings-side">
          <section className="card integration-card">
            <span className="telegram-logo">
              <Send size={26} />
            </span>
            <div className="integration-title">
              <h2>Telegram</h2>
              <span className="badge ready">
                {config?.telegram_connected ? "Токен настроен" : "Демо-режим"}
              </span>
            </div>
            <p>
              Ваш ассистент там, где удобно клиентам. Подключите бота через
              BotFather.
            </p>
            <ol>
              <li>
                Добавьте токен в <code>TELEGRAM_BOT_TOKEN</code>
              </li>
              <li>
                Укажите публичный HTTPS-адрес и секрет вебхука в{" "}
                <code>.env</code>
              </li>
              <li>Перезапустите backend и подключите бота</li>
            </ol>
            <button className="btn" disabled={busy} onClick={connect}>
              <Link size={16} />
              Подключить Telegram <ArrowUpRight size={16} />
            </button>
          </section>
          <section className="card integration-card">
            <span className="feature-icon">
              <Sparkles size={23} />
            </span>
            <h2>Интеллект, которому можно доверять</h2>
            <p>
              {config?.llm_connected
                ? "LLM API подключён. Ответы формируются из контекста базы знаний."
                : "Локальный поиск по базе знаний работает без ключей. Для генеративных ответов добавьте LLM_API_KEY в .env."}
            </p>
            <div className="integration-note">
              <ShieldCheck size={15} />
              Ключи провайдеров хранятся на сервере
            </div>
          </section>
          <section className="card integration-card">
            <h2>Доступ администратора</h2>
            <p>Для сервера с отключённым демо-режимом.</p>
            <label>
              API-ключ
              <input
                type="password"
                autoComplete="off"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="ADMIN_API_KEY"
              />
            </label>
            <button
              className="btn"
              onClick={() => {
                sessionStorage.setItem("forma-api-key", key);
                setError("");
                load();
                notify("Ключ сохранён для текущей вкладки");
              }}
            >
              Применить ключ
            </button>
          </section>
        </div>
      </div>
    </>
  );
}
