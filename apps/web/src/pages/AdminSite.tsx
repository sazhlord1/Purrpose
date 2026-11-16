import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import { Link, Navigate, useSearchParams } from 'react-router-dom';
import { BackLink } from '../components/BackLink.js';
import { DoodleButton, SketchCard } from '../components/ui/index.js';
import { api, ApiError } from '../lib/api.js';
import { useMe } from '../lib/queries.js';
import {
  BLOG_URL,
  mediaUrl,
  uploadMedia,
  type BlogListRow,
  type ContactRow,
  type DeliveryRow,
  type MediaRef,
} from '../lib/siteAdmin.js';
import { fwdArrow, t } from '../i18n/index.js';
import '../styles/admin-site.css';

const faDate = (iso: string) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Tehran' }).format(new Date(iso));
const faDateTime = (iso: string) =>
  new Intl.DateTimeFormat('fa-IR-u-ca-persian', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' }).format(new Date(iso));
const errText = (e: unknown) => (e instanceof ApiError ? e.message : t('Failed.'));

type Tab = 'messages' | 'deliveries' | 'blog';

/** purrpose.ir and blog.purrpose.ir, run from the app's admin panel. */
export function AdminSite() {
  const me = useMe();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab | null) ?? 'messages';
  const isAdmin = me.data?.user.role === 'ADMIN';
  const counts = useQuery({
    queryKey: ['admin-contact', '1'],
    queryFn: () => api<{ openCount: number; messages: ContactRow[] }>('/admin/contact?open=1'),
    enabled: isAdmin,
  });

  if (me.isLoading) return <main><p className="muted">{t('checking your badge…')}</p></main>;
  if (!isAdmin) return <Navigate to="/admin/login" replace />;

  const open = counts.data?.openCount ?? 0;
  return (
    <main className="site-admin">
      <BackLink />
      <h1>{t('Website')}</h1>
      <p className="muted">{t('Messages from the contact form, food delivery proofs and the blog.')}</p>
      <div className="site-tabs" role="tablist">
        {(
          [
            ['messages', t('Messages'), open],
            ['deliveries', t('Food deliveries'), 0],
            ['blog', t('Blog'), 0],
          ] as const
        ).map(([id, label, n]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={tab === id ? 'on' : ''}
            onClick={() => setParams({ tab: id }, { replace: true })}
          >
            {label}
            {n > 0 && <span className="site-badge">{n.toLocaleString('fa-IR')}</span>}
          </button>
        ))}
      </div>
      {tab === 'messages' && <Messages />}
      {tab === 'deliveries' && <Deliveries />}
      {tab === 'blog' && <BlogList />}
    </main>
  );
}

// ───────────────────────── Messages ─────────────────────────

const KIND_LABEL: Record<ContactRow['kind'], string> = { shelter: 'Shelter', user: 'User', other: 'Other' };

function Messages() {
  const qc = useQueryClient();
  const [onlyOpen, setOnlyOpen] = useState(true);
  const list = useQuery({
    queryKey: ['admin-contact', onlyOpen ? '1' : '0'],
    queryFn: () => api<{ openCount: number; messages: ContactRow[] }>(`/admin/contact?open=${onlyOpen ? 1 : 0}`),
  });
  const refresh = () => void qc.invalidateQueries({ queryKey: ['admin-contact'] });
  const mark = useMutation({
    mutationFn: (v: { id: string; handled: boolean }) => api(`/admin/contact/${v.id}`, { method: 'POST', body: { handled: v.handled } }),
    onSuccess: refresh,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/contact/${id}`, { method: 'DELETE' }),
    onSuccess: refresh,
  });

  return (
    <SketchCard variant="a">
      <div className="site-head">
        <h2>{t('Messages')}</h2>
        <div className="chip-row" style={{ margin: 0 }}>
          <button type="button" className={`chip ${onlyOpen ? 'chip-active' : ''}`} onClick={() => setOnlyOpen(true)}>{t('Open')}</button>
          <button type="button" className={`chip ${!onlyOpen ? 'chip-active' : ''}`} onClick={() => setOnlyOpen(false)}>{t('All')}</button>
        </div>
      </div>
      {list.isLoading ? (
        <p className="muted">{t('fetching the roster…')}</p>
      ) : !list.data?.messages.length ? (
        <p className="muted">{onlyOpen ? t('No open messages. Inbox zero!') : t('No messages yet.')}</p>
      ) : (
        <ul className="site-msgs">
          {list.data.messages.map(m => (
            <li key={m.id} className={m.handledAt ? 'done' : ''}>
              <div className="site-msg-top">
                <strong>{m.name}</strong>
                <span className="chip">{t(KIND_LABEL[m.kind])}</span>
                <span className="muted site-msg-date">{faDateTime(m.createdAt)}</span>
              </div>
              <a className="ltr site-msg-mail" href={`mailto:${m.email}?subject=${encodeURIComponent('پاسخ پرپس')}`}>{m.email}</a>
              <p className="site-msg-text">{m.message}</p>
              <div className="chip-row" style={{ margin: 0 }}>
                <a className="chip" href={`mailto:${m.email}?subject=${encodeURIComponent('پاسخ پرپس')}`}>{t('Reply by email')}</a>
                <button type="button" className="chip" onClick={() => mark.mutate({ id: m.id, handled: !m.handledAt })}>
                  {m.handledAt ? t('Reopen') : t('Mark as done')}
                </button>
                <button
                  type="button"
                  className="chip site-danger"
                  onClick={() => {
                    if (window.confirm(t('Delete this message?'))) remove.mutate(m.id);
                  }}
                >
                  {t('Delete')}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SketchCard>
  );
}

// ───────────────────────── Food deliveries ─────────────────────────

interface DeliveryDraft {
  id: string | null;
  title: string;
  shelter: string;
  summary: string;
  caption: string;
  deliveredAt: string;
  published: boolean;
  media: MediaRef[];
}

const emptyDelivery = (): DeliveryDraft => ({
  id: null,
  title: '',
  shelter: '',
  summary: '',
  caption: '',
  deliveredAt: new Date().toISOString(),
  published: true,
  media: [],
});

/** The last 180 days, shown in the Persian calendar (a delivery is always in the past). */
function DayPicker({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const days = useMemo(() => {
    const out: { iso: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 180; i++) {
      const d = new Date(now.getTime() - i * 86_400_000);
      d.setUTCHours(9, 0, 0, 0);
      out.push({ iso: d.toISOString(), label: faDate(d.toISOString()) });
    }
    return out;
  }, []);
  const current = days.find(d => d.label === faDate(value))?.iso ?? days[0]!.iso;
  return (
    <select value={current} onChange={e => onChange(e.target.value)}>
      {days.map((d, i) => (
        <option key={d.iso} value={d.iso}>
          {i === 0 ? `${t('Today')} · ${d.label}` : d.label}
        </option>
      ))}
    </select>
  );
}

function MediaThumb({ m }: { m: MediaRef }) {
  return m.type.startsWith('video/') ? (
    <video src={m.url} muted playsInline preload="metadata" />
  ) : (
    <img src={m.url} alt="" loading="lazy" />
  );
}

function Deliveries() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ['admin-deliveries'], queryFn: () => api<{ deliveries: DeliveryRow[] }>('/admin/deliveries') });
  const [draft, setDraft] = useState<DeliveryDraft | null>(null);
  const [uploading, setUploading] = useState(0);
  const [note, setNote] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = useMutation({
    mutationFn: (d: DeliveryDraft) =>
      api<{ delivery: DeliveryRow }>(d.id ? `/admin/deliveries/${d.id}` : '/admin/deliveries', {
        method: 'POST',
        body: {
          title: d.title,
          shelter: d.shelter,
          summary: d.summary,
          caption: d.caption,
          deliveredAt: d.deliveredAt,
          published: d.published,
          mediaIds: d.media.map(m => m.id),
        },
      }),
    onSuccess: () => {
      setDraft(null);
      setNote(t('Saved. It’s on purrpose.ir/deliveries.'));
      void qc.invalidateQueries({ queryKey: ['admin-deliveries'] });
    },
    onError: e => setNote(errText(e)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/deliveries/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      setDraft(null);
      void qc.invalidateQueries({ queryKey: ['admin-deliveries'] });
    },
  });

  async function addFiles(files: FileList | null) {
    if (!files?.length || !draft) return;
    setNote(null);
    for (const f of Array.from(files)) {
      setUploading(n => n + 1);
      try {
        const m = await uploadMedia(f, 'delivery');
        setDraft(d => (d ? { ...d, media: [...d.media, m] } : d));
      } catch (e) {
        setNote(errText(e));
      } finally {
        setUploading(n => n - 1);
      }
    }
    if (fileRef.current) fileRef.current.value = '';
  }
  const move = (i: number, by: number) =>
    setDraft(d => {
      if (!d) return d;
      const media = [...d.media];
      const j = i + by;
      if (j < 0 || j >= media.length) return d;
      [media[i], media[j]] = [media[j]!, media[i]!];
      return { ...d, media };
    });

  if (draft) {
    const set = <K extends keyof DeliveryDraft>(k: K, v: DeliveryDraft[K]) => setDraft(d => (d ? { ...d, [k]: v } : d));
    return (
      <SketchCard variant="b">
        <h2>{draft.id ? t('Edit delivery') : t('New food delivery')}</h2>
        <form
          className="auth-form"
          onSubmit={e => {
            e.preventDefault();
            save.mutate(draft);
          }}
        >
          <label className="field">
            <span>{t('Title')}</span>
            <input required maxLength={140} value={draft.title} onChange={e => set('title', e.target.value)} placeholder={t('e.g. Aban delivery to Vafa shelter')} />
          </label>
          <label className="field">
            <span>{t('Shelter')}</span>
            <input maxLength={120} value={draft.shelter} onChange={e => set('shelter', e.target.value)} />
          </label>
          <label className="field">
            <span>{t('What was delivered (one line)')}</span>
            <input maxLength={200} value={draft.summary} onChange={e => set('summary', e.target.value)} placeholder={t('e.g. 40 cans, 12 kg dry food')} />
          </label>
          <label className="field">
            <span>{t('Date')}</span>
            <DayPicker value={draft.deliveredAt} onChange={v => set('deliveredAt', v)} />
          </label>
          <label className="field">
            <span>{t('Story (optional)')}</span>
            <textarea rows={4} maxLength={3000} value={draft.caption} onChange={e => set('caption', e.target.value)} />
          </label>

          <div className="field">
            <span>{t('Photos and videos')}</span>
            <div className="site-media-grid">
              {draft.media.map((m, i) => (
                <figure key={m.id}>
                  <MediaThumb m={m} />
                  <div className="site-media-tools">
                    <button type="button" aria-label={t('Move earlier')} onClick={() => move(i, -1)}>→</button>
                    <button type="button" aria-label={t('Take out')} onClick={() => set('media', draft.media.filter(x => x.id !== m.id))}>✕</button>
                    <button type="button" aria-label={t('Move later')} onClick={() => move(i, 1)}>←</button>
                  </div>
                </figure>
              ))}
              <button type="button" className="site-media-add" onClick={() => fileRef.current?.click()} disabled={uploading > 0}>
                {uploading > 0 ? t('Uploading…') : `+ ${t('Add')}`}
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*,video/mp4,video/webm,video/quicktime" multiple hidden onChange={e => void addFiles(e.target.files)} />
            <p className="field-note">{t('Pictures are made smaller before upload. Videos: MP4, up to 40 MB.')}</p>
          </div>

          <label className="site-check">
            <input type="checkbox" checked={draft.published} onChange={e => set('published', e.target.checked)} />
            <span>{t('Show on the website')}</span>
          </label>

          <div className="chip-row">
            <DoodleButton type="submit" variant="primary" disabled={save.isPending || uploading > 0}>{t('Save')}</DoodleButton>
            <DoodleButton onClick={() => setDraft(null)}>{t('Cancel')}</DoodleButton>
            {draft.id && (
              <button
                type="button"
                className="chip site-danger"
                onClick={() => {
                  if (window.confirm(t('Delete this delivery and its photos?'))) remove.mutate(draft.id!);
                }}
              >
                {t('Delete')}
              </button>
            )}
          </div>
          {note && <p className="muted" role="status">{note}</p>}
        </form>
      </SketchCard>
    );
  }

  return (
    <SketchCard variant="b">
      <div className="site-head">
        <h2>{t('Food deliveries')}</h2>
        <DoodleButton variant="primary" onClick={() => { setNote(null); setDraft(emptyDelivery()); }}>+ {t('New')}</DoodleButton>
      </div>
      <p className="muted">
        {t('Photos and videos of food reaching the shelters. They show on')}{' '}
        <a href="https://purrpose.ir/deliveries" target="_blank" rel="noopener noreferrer" className="ltr">purrpose.ir/deliveries</a>
      </p>
      {note && <p className="muted" role="status">{note}</p>}
      {list.isLoading ? (
        <p className="muted">{t('fetching the roster…')}</p>
      ) : !list.data?.deliveries.length ? (
        <p className="muted">{t('No deliveries yet.')}</p>
      ) : (
        <ul className="site-deliveries">
          {list.data.deliveries.map(d => (
            <li key={d.id}>
              <button type="button" onClick={() => { setNote(null); setDraft({ ...d }); }}>
                <span className="site-del-thumb">{d.media[0] ? <MediaThumb m={d.media[0]} /> : '🐾'}</span>
                <span className="site-del-body">
                  <strong>{d.title}</strong>
                  <span className="muted">{[d.shelter, faDate(d.deliveredAt), t('{n} files', { n: d.media.length })].filter(Boolean).join(' · ')}</span>
                  {!d.published && <span className="chip">{t('Hidden')}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </SketchCard>
  );
}

// ───────────────────────── Blog ─────────────────────────

function BlogList() {
  const list = useQuery({ queryKey: ['admin-blog'], queryFn: () => api<{ posts: BlogListRow[] }>('/admin/blog') });
  return (
    <SketchCard variant="c">
      <div className="site-head">
        <h2>{t('Blog')}</h2>
        <DoodleButton variant="primary" href="/admin/blog/new">+ {t('New post')}</DoodleButton>
      </div>
      <p className="muted">
        <a href={BLOG_URL} target="_blank" rel="noopener noreferrer" className="ltr">blog.purrpose.ir</a> {fwdArrow()}
      </p>
      {list.isLoading ? (
        <p className="muted">{t('fetching the roster…')}</p>
      ) : !list.data?.posts.length ? (
        <p className="muted">{t('No posts yet. Write the first one!')}</p>
      ) : (
        <ul className="site-deliveries">
          {list.data.posts.map(p => (
            <li key={p.id}>
              <Link to={`/admin/blog/${p.id}`}>
                <span className="site-del-thumb">{p.coverMediaId ? <img src={mediaUrl(p.coverMediaId)} alt="" loading="lazy" /> : '✍️'}</span>
                <span className="site-del-body">
                  <strong>{p.title}</strong>
                  <span className="muted">
                    {p.published && p.publishedAt ? faDate(p.publishedAt) : t('Draft')} · {t('edited {date}', { date: faDateTime(p.updatedAt) })}
                  </span>
                  {!p.published && <span className="chip">{t('Draft')}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </SketchCard>
  );
}
