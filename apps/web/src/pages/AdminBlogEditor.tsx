import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BLOG_WEIGHTS,
  blogPlainText,
  readingMinutes,
  renderBlock,
  slugify,
  blockStyle,
  type BlogBlock,
} from '@purrpose/shared';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { DoodleButton, SketchCard } from '../components/ui/index.js';
import { api, ApiError } from '../lib/api.js';
import { useMe } from '../lib/queries.js';
import { BLOG_URL, mediaUrl, tidyPersian, uploadMedia, wordCount, type BlogPostFull } from '../lib/siteAdmin.js';
import { backArrow, t } from '../i18n/index.js';
import '../styles/admin-site.css';

/**
 * The blog editor: a post is a column of blocks (paragraph, heading, picture, list,
 * quote, note box, button, divider). Each text block has its own alignment, direction,
 * font (Anjoman for Persian, Lora for English), weight, size and colour. Inline marks:
 * **bold** *italic* __underline__ ~~strike~~ ==highlight== [link](https://…).
 */

type Draft = Omit<BlogPostFull, 'id' | 'publishedAt' | 'updatedAt'> & { id: string | null };
type TextBlock = Extract<BlogBlock, { text: string }>;
type Styled = Extract<BlogBlock, { type: 'paragraph' | 'heading' | 'quote' | 'list' | 'callout' }>;

const emptyDraft = (): Draft => ({
  id: null,
  slug: '',
  title: '',
  excerpt: '',
  lang: 'fa',
  coverMediaId: null,
  content: [{ type: 'paragraph', text: '' }],
  seoTitle: '',
  seoDescription: '',
  tags: [],
  published: false,
});

const COLORS = ['#2b231f', '#5a4e48', '#e28743', '#b83b32', '#4e8752', '#5c93c4'];
const WEIGHT_LABEL: Record<number, string> = { 300: 'Light', 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold', 900: 'Black' };
const draftKey = (id: string | null) => `purrpose.blogdraft.${id ?? 'new'}`;

const NEW_BLOCK: Record<string, () => BlogBlock> = {
  paragraph: () => ({ type: 'paragraph', text: '' }),
  h2: () => ({ type: 'heading', level: 2, text: '' }),
  h3: () => ({ type: 'heading', level: 3, text: '' }),
  list: () => ({ type: 'list', ordered: false, items: [''] }),
  ol: () => ({ type: 'list', ordered: true, items: [''] }),
  quote: () => ({ type: 'quote', text: '', cite: '' }),
  callout: () => ({ type: 'callout', tone: 'tip', text: '' }),
  button: () => ({ type: 'button', label: 'شروع رایگان با پرپس', url: 'https://app.purrpose.ir' }),
  divider: () => ({ type: 'divider' }),
};
const ADD_MENU: [string, string][] = [
  ['paragraph', 'Paragraph'],
  ['h2', 'Heading'],
  ['h3', 'Subheading'],
  ['image', 'Picture'],
  ['list', 'Bullet list'],
  ['ol', 'Numbered list'],
  ['quote', 'Quote'],
  ['callout', 'Note box'],
  ['button', 'Button'],
  ['divider', 'Divider'],
];

function isStyled(b: BlogBlock): b is Styled {
  return b.type === 'paragraph' || b.type === 'heading' || b.type === 'quote' || b.type === 'list' || b.type === 'callout';
}

/** Drops empty blocks before saving (the server wants at least one item in a list). */
function cleanBlocks(blocks: BlogBlock[]): BlogBlock[] {
  return blocks.flatMap((b): BlogBlock[] => {
    if (b.type === 'list') {
      const items = b.items.map(i => i.trim()).filter(Boolean);
      return items.length ? [{ ...b, items }] : [];
    }
    if ('text' in b && !b.text.trim()) return [];
    return [b];
  });
}

export function AdminBlogEditor() {
  const { id: routeId } = useParams();
  const isNew = !routeId || routeId === 'new';
  const me = useMe();
  const isAdmin = me.data?.user.role === 'ADMIN';
  const nav = useNavigate();
  const qc = useQueryClient();

  const loaded = useQuery({
    queryKey: ['admin-blog-post', routeId],
    queryFn: () => api<{ post: BlogPostFull }>(`/admin/blog/${routeId}`),
    enabled: isAdmin && !isNew,
  });

  const [draft, setDraft] = useState<Draft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [preview, setPreview] = useState(false);
  const [note, setNote] = useState<{ text: string; bad?: boolean } | null>(null);
  const [restored, setRestored] = useState(false);
  const [busy, setBusy] = useState(0);
  const areas = useRef(new Map<number, HTMLTextAreaElement>());
  const coverRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLInputElement>(null);
  const insertAt = useRef<number>(0);
  /** The last saved/loaded copy: only real edits are kept as a local draft. */
  const baseline = useRef('');

  // Start from the server copy (or a fresh post), unless a newer local draft exists.
  useEffect(() => {
    if (draft) return;
    if (!isNew && !loaded.data) return;
    const server: Draft = loaded.data ? { ...loaded.data.post } : emptyDraft();
    try {
      const raw = localStorage.getItem(draftKey(isNew ? null : routeId!));
      if (raw) {
        const local = JSON.parse(raw) as { at: string; draft: Draft };
        if (!loaded.data || local.at > loaded.data.post.updatedAt) {
          setDraft({ ...local.draft, id: server.id });
          setRestored(true);
          setSlugTouched(true);
          return;
        }
      }
    } catch {
      /* ignore broken drafts */
    }
    baseline.current = JSON.stringify(server);
    setDraft(server);
    setSlugTouched(!isNew);
  }, [draft, isNew, loaded.data, routeId]);

  // Keep an unsaved copy on this device (a closed tab doesn't lose the text).
  useEffect(() => {
    if (!draft || JSON.stringify(draft) === baseline.current) return;
    const h = setTimeout(() => {
      try {
        localStorage.setItem(draftKey(draft.id), JSON.stringify({ at: new Date().toISOString(), draft }));
      } catch {
        /* storage full or blocked */
      }
    }, 600);
    return () => clearTimeout(h);
  }, [draft]);

  const save = useMutation({
    mutationFn: (d: Draft) =>
      api<{ post: BlogPostFull }>(d.id ? `/admin/blog/${d.id}` : '/admin/blog', {
        method: 'POST',
        body: {
          slug: d.slug,
          title: d.title,
          excerpt: d.excerpt,
          lang: d.lang,
          coverMediaId: d.coverMediaId,
          content: cleanBlocks(d.content),
          seoTitle: d.seoTitle,
          seoDescription: d.seoDescription,
          tags: d.tags,
          published: d.published,
        },
      }),
    onSuccess: ({ post }) => {
      try {
        localStorage.removeItem(draftKey(null));
        localStorage.removeItem(draftKey(post.id));
      } catch {
        /* ignore */
      }
      setRestored(false);
      baseline.current = JSON.stringify({ ...post });
      setDraft({ ...post });
      setNote({ text: post.published ? t('Published.') : t('Saved as a draft.') });
      void qc.invalidateQueries({ queryKey: ['admin-blog'] });
      qc.setQueryData(['admin-blog-post', post.id], { post });
      if (isNew) nav(`/admin/blog/${post.id}`, { replace: true });
    },
    onError: e => setNote({ text: e instanceof ApiError ? e.message : t('Failed.'), bad: true }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api(`/admin/blog/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-blog'] });
      nav('/admin/site?tab=blog', { replace: true });
    },
  });

  const stats = useMemo(() => {
    if (!draft) return { words: 0, minutes: 1 };
    const blocks = cleanBlocks(draft.content);
    return { words: wordCount(blogPlainText(blocks)), minutes: readingMinutes(blocks) };
  }, [draft]);

  if (me.isLoading || (!isNew && loaded.isLoading) || (isAdmin && !draft && !loaded.isError)) {
    return <main><p className="muted">{t('checking your badge…')}</p></main>;
  }
  if (!isAdmin) return <Navigate to="/admin/login" replace />;
  if (loaded.isError || !draft) return <main><p className="muted">{t('We couldn’t find that.')}</p></main>;

  const fa = draft.lang === 'fa';
  const defaultDir = fa ? 'rtl' : 'ltr';
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft(d => (d ? { ...d, [k]: v } : d));
  const setTitle = (title: string) =>
    setDraft(d => (d ? { ...d, title, ...(slugTouched ? {} : { slug: slugify(title) }) } : d));
  const updateBlock = (i: number, patch: Partial<BlogBlock>) =>
    setDraft(d => (d ? { ...d, content: d.content.map((b, j) => (j === i ? ({ ...b, ...patch } as BlogBlock) : b)) } : d));
  const removeBlock = (i: number) =>
    setDraft(d => (d ? { ...d, content: d.content.length > 1 ? d.content.filter((_, j) => j !== i) : [NEW_BLOCK.paragraph!()] } : d));
  const moveBlock = (i: number, by: number) =>
    setDraft(d => {
      if (!d) return d;
      const c = [...d.content];
      const j = i + by;
      if (j < 0 || j >= c.length) return d;
      [c[i], c[j]] = [c[j]!, c[i]!];
      return { ...d, content: c };
    });
  const insertBlock = (at: number, b: BlogBlock) => {
    setDraft(d => (d ? { ...d, content: [...d.content.slice(0, at), b, ...d.content.slice(at)] } : d));
    setTimeout(() => areas.current.get(at)?.focus(), 30);
  };
  const addBlock = (kind: string, at: number) => {
    if (kind === 'image') {
      insertAt.current = at;
      imageRef.current?.click();
      return;
    }
    insertBlock(at, NEW_BLOCK[kind]!());
  };

  async function upload(file: File | undefined, then: (id: string) => void) {
    if (!file) return;
    setBusy(n => n + 1);
    setNote(null);
    try {
      then((await uploadMedia(file, 'blog')).id);
    } catch (e) {
      setNote({ text: e instanceof ApiError ? e.message : t('Failed.'), bad: true });
    } finally {
      setBusy(n => n - 1);
    }
  }

  /** Wraps the selected text of block i with a mark (or inserts it at the cursor). */
  function wrap(i: number, before: string, after = before, placeholder = '') {
    const el = areas.current.get(i);
    const b = draft!.content[i];
    if (!el || !b) return;
    const isList = b.type === 'list';
    const value = isList ? b.items.join('\n') : 'text' in b ? b.text : '';
    const s = el.selectionStart;
    const e = el.selectionEnd;
    const picked = value.slice(s, e) || placeholder;
    const next = value.slice(0, s) + before + picked + after + value.slice(e);
    if (isList) updateBlock(i, { items: next.split('\n') } as Partial<BlogBlock>);
    else updateBlock(i, { text: next } as Partial<BlogBlock>);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(s + before.length, s + before.length + picked.length);
    });
  }
  function addLink(i: number) {
    const url = window.prompt(t('Link address (https://…)'), 'https://');
    if (!url || !/^(https?:\/\/|\/|mailto:)/.test(url.trim())) return;
    wrap(i, '[', `](${url.trim()})`, t('link text'));
  }
  function onKey(i: number, e: KeyboardEvent<HTMLTextAreaElement>) {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'b') { e.preventDefault(); wrap(i, '**'); }
    else if (mod && e.key.toLowerCase() === 'i') { e.preventDefault(); wrap(i, '*'); }
    else if (mod && e.key.toLowerCase() === 'u') { e.preventDefault(); wrap(i, '__'); }
    else if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); addLink(i); }
    else if (e.shiftKey && e.key === ' ') {
      // Shift+Space: نیم‌فاصله (half-space), as in Persian keyboards.
      e.preventDefault();
      wrap(i, '‌', '');
    }
  }
  const tidyAll = () =>
    setDraft(d =>
      d
        ? {
            ...d,
            title: tidyPersian(d.title),
            excerpt: tidyPersian(d.excerpt),
            content: d.content.map(b =>
              b.type === 'list'
                ? { ...b, items: b.items.map(tidyPersian) }
                : 'text' in b && (b as Styled).dir !== 'ltr'
                  ? ({ ...b, text: tidyPersian(b.text) } as BlogBlock)
                  : b,
            ),
          }
        : d,
    );

  const publishOk = draft.title.trim() && draft.slug.trim();
  const seoTitle = draft.seoTitle || draft.title || t('Post title');
  const seoDesc = draft.seoDescription || draft.excerpt || blogPlainText(cleanBlocks(draft.content)).slice(0, 160);

  return (
    <main className="site-admin blog-editor">
      <Link className="back-link" to="/admin/site?tab=blog">{backArrow()} {t('Blog')}</Link>

      <div className="be-bar">
        <span className="muted">{t('{w} words · {m} min read', { w: stats.words.toLocaleString('fa-IR'), m: stats.minutes.toLocaleString('fa-IR') })}</span>
        <div className="chip-row" style={{ margin: 0 }}>
          <button type="button" className={`chip ${!preview ? 'chip-active' : ''}`} onClick={() => setPreview(false)}>{t('Write')}</button>
          <button type="button" className={`chip ${preview ? 'chip-active' : ''}`} onClick={() => setPreview(true)}>{t('Preview')}</button>
          {fa && <button type="button" className="chip" onClick={tidyAll} title={t('ی/ک, half-spaces, Persian digits and punctuation')}>{t('Tidy Persian')}</button>}
        </div>
      </div>
      {restored && (
        <p className="be-restored">
          {t('Restored your unsaved changes from this device.')}{' '}
          <button
            type="button"
            className="linklike"
            onClick={() => {
              try { localStorage.removeItem(draftKey(draft.id)); } catch { /* ignore */ }
              setRestored(false);
              const fresh: Draft = loaded.data ? { ...loaded.data.post } : emptyDraft();
              baseline.current = JSON.stringify(fresh);
              setDraft(fresh);
            }}
          >
            {t('Discard them')}
          </button>
        </p>
      )}

      {preview ? (
        <div className={`blog-preview ${fa ? '' : 'en'}`} dir={defaultDir} lang={draft.lang}>
          {draft.coverMediaId && <img className="bp-cover" src={mediaUrl(draft.coverMediaId)} alt="" />}
          <h1>{draft.title || t('Post title')}</h1>
          <div
            className="bp-body"
            // renderBlock escapes all text; only its own tags come out.
            dangerouslySetInnerHTML={{ __html: cleanBlocks(draft.content).map(b => renderBlock(b, mediaUrl)).join('\n') }}
          />
        </div>
      ) : (
        <>
          <SketchCard variant="a">
            <input
              className="be-title"
              dir={defaultDir}
              placeholder={t('Post title')}
              value={draft.title}
              maxLength={200}
              onChange={e => setTitle(e.target.value)}
            />
            <div className="be-cover">
              {draft.coverMediaId ? (
                <>
                  <img src={mediaUrl(draft.coverMediaId)} alt="" />
                  <div className="chip-row" style={{ margin: 0 }}>
                    <button type="button" className="chip" onClick={() => coverRef.current?.click()}>{t('Change cover')}</button>
                    <button type="button" className="chip" onClick={() => set('coverMediaId', null)}>{t('Take out')}</button>
                  </div>
                </>
              ) : (
                <button type="button" className="be-cover-add" onClick={() => coverRef.current?.click()} disabled={busy > 0}>
                  🖼️ {t('Add a cover picture (16:9 looks best)')}
                </button>
              )}
              <input ref={coverRef} type="file" accept="image/*" hidden onChange={e => void upload(e.target.files?.[0], id => set('coverMediaId', id))} />
            </div>
          </SketchCard>

          <div className="be-blocks">
            {draft.content.map((b, i) => (
              <BlockEditor
                key={i}
                b={b}
                i={i}
                count={draft.content.length}
                defaultDir={defaultDir}
                areaRef={el => (el ? areas.current.set(i, el) : areas.current.delete(i))}
                onChange={p => updateBlock(i, p)}
                onKey={e => onKey(i, e)}
                onWrap={(a, z, ph) => wrap(i, a, z, ph)}
                onLink={() => addLink(i)}
                onMove={by => moveBlock(i, by)}
                onRemove={() => removeBlock(i)}
                onAdd={kind => addBlock(kind, i + 1)}
                onReplaceImage={() => {
                  insertAt.current = -1 - i;
                  imageRef.current?.click();
                }}
              />
            ))}
            <AddMenu onPick={kind => addBlock(kind, draft.content.length)} big />
            <input
              ref={imageRef}
              type="file"
              accept="image/*"
              hidden
              onChange={e => {
                const at = insertAt.current;
                void upload(e.target.files?.[0], mediaId => {
                  if (at < 0) updateBlock(-1 - at, { mediaId } as Partial<BlogBlock>);
                  else insertBlock(at, { type: 'image', mediaId, caption: '', alt: '', width: 'normal' });
                });
                e.target.value = '';
              }}
            />
            {busy > 0 && <p className="muted">{t('Uploading…')}</p>}
          </div>
        </>
      )}

      <SketchCard variant="b">
        <h2>{t('Post settings')}</h2>
        <div className="be-grid">
          <label className="field">
            <span>{t('Language')}</span>
            <select value={draft.lang} onChange={e => set('lang', e.target.value as Draft['lang'])}>
              <option value="fa">فارسی</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="field">
            <span>{t('Address')}</span>
            <div className="be-slug ltr">
              <span>blog.purrpose.ir/</span>
              <input
                value={draft.slug}
                maxLength={120}
                onChange={e => {
                  setSlugTouched(true);
                  set('slug', slugify(e.target.value.replace(/\s/g, '-')) || e.target.value.toLowerCase());
                }}
              />
            </div>
          </label>
        </div>
        <label className="field">
          <span>{t('Summary (shown on the blog home and in Google)')}</span>
          <textarea rows={2} maxLength={400} dir={defaultDir} value={draft.excerpt} onChange={e => set('excerpt', e.target.value)} placeholder={t('Leave empty to use the first lines')} />
        </label>
        <label className="field">
          <span>{t('Tags (comma separated)')}</span>
          <input
            dir={defaultDir}
            value={draft.tags.join('، ')}
            onChange={e => set('tags', e.target.value.split(/[,،]/).map(x => x.trim()).filter(Boolean).slice(0, 12))}
            placeholder={t('e.g. habits, focus, cats')}
          />
        </label>

        <details className="be-seo">
          <summary>{t('Google (SEO)')}</summary>
          <label className="field">
            <span>{t('Title in Google')} <em className="be-count">{(draft.seoTitle || draft.title).length}/60</em></span>
            <input dir={defaultDir} maxLength={120} value={draft.seoTitle} placeholder={draft.title} onChange={e => set('seoTitle', e.target.value)} />
          </label>
          <label className="field">
            <span>{t('Description in Google')} <em className="be-count">{seoDesc.length}/160</em></span>
            <textarea rows={2} dir={defaultDir} maxLength={300} value={draft.seoDescription} placeholder={draft.excerpt} onChange={e => set('seoDescription', e.target.value)} />
          </label>
          <div className="be-serp" dir={defaultDir}>
            <span className="ltr be-serp-url">blog.purrpose.ir › {draft.slug || '…'}</span>
            <strong>{seoTitle.slice(0, 64)}{seoTitle.length > 64 ? '…' : ''} · بلاگ پرپس</strong>
            <span>{seoDesc.slice(0, 160)}{seoDesc.length > 160 ? '…' : ''}</span>
          </div>
        </details>

        <label className="site-check">
          <input type="checkbox" checked={draft.published} onChange={e => set('published', e.target.checked)} />
          <span>{t('Published (visible on the blog)')}</span>
        </label>

        <div className="chip-row">
          <DoodleButton variant="primary" disabled={!publishOk || save.isPending || busy > 0} onClick={() => save.mutate(draft)}>
            {draft.published ? t('Save and publish') : t('Save draft')}
          </DoodleButton>
          {draft.id && draft.published && (
            <a className="chip" href={`${BLOG_URL}/${encodeURIComponent(draft.slug)}`} target="_blank" rel="noopener noreferrer">{t('Open on the blog')} ↗</a>
          )}
          {draft.id && (
            <button
              type="button"
              className="chip site-danger"
              onClick={() => {
                if (window.confirm(t('Delete this post for good?'))) remove.mutate(draft.id!);
              }}
            >
              {t('Delete')}
            </button>
          )}
        </div>
        {note && <p className={note.bad ? 'be-error' : 'muted'} role="status">{note.text}</p>}
        <p className="field-note">
          {t('Marks: **bold**, *italic*, __underline__, ~~strike~~, ==highlight==, [text](link). Ctrl+B / Ctrl+I / Ctrl+K. Shift+Space = half-space.')}
        </p>
      </SketchCard>
    </main>
  );
}

function AddMenu({ onPick, big }: { onPick: (kind: string) => void; big?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`be-add ${big ? 'big' : ''}`}>
      <button type="button" className="be-add-btn" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        + {big ? t('Add a block') : ''}
      </button>
      {open && (
        <div className="be-add-menu" role="menu">
          {ADD_MENU.map(([k, label]) => (
            <button
              key={k}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onPick(k);
              }}
            >
              {t(label)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

interface BlockProps {
  b: BlogBlock;
  i: number;
  count: number;
  defaultDir: 'rtl' | 'ltr';
  areaRef: (el: HTMLTextAreaElement | null) => void;
  onChange: (p: Partial<BlogBlock>) => void;
  onKey: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  onWrap: (before: string, after?: string, placeholder?: string) => void;
  onLink: () => void;
  onMove: (by: number) => void;
  onRemove: () => void;
  onAdd: (kind: string) => void;
  onReplaceImage: () => void;
}

const TYPE_LABEL: Record<BlogBlock['type'], string> = {
  paragraph: 'Paragraph',
  heading: 'Heading',
  image: 'Picture',
  quote: 'Quote',
  list: 'List',
  callout: 'Note box',
  button: 'Button',
  divider: 'Divider',
};

function AutoArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { areaRef?: (el: HTMLTextAreaElement | null) => void }) {
  const { areaRef, ...rest } = props;
  const local = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = local.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [props.value]);
  return (
    <textarea
      {...rest}
      ref={el => {
        local.current = el;
        areaRef?.(el);
      }}
    />
  );
}

function BlockEditor(p: BlockProps) {
  const { b } = p;
  const styled = isStyled(b) ? b : null;
  const dir = styled?.dir ?? p.defaultDir;
  const style = styled ? (Object.fromEntries(
    blockStyle(styled)
      .split(';')
      .filter(Boolean)
      .map(rule => {
        const [k, v] = rule.split(':') as [string, string];
        return [k.replace(/-([a-z])/g, (_m, c: string) => c.toUpperCase()), v];
      }),
  ) as React.CSSProperties) : undefined;

  return (
    <div className={`be-block be-${b.type}`}>
      <div className="be-tools">
        <span className="be-type">{t(TYPE_LABEL[b.type])}</span>
        {b.type === 'heading' && (
          <select value={b.level} onChange={e => p.onChange({ level: Number(e.target.value) as 2 | 3 | 4 } as Partial<BlogBlock>)} aria-label={t('Heading size')}>
            <option value={2}>H2</option>
            <option value={3}>H3</option>
            <option value={4}>H4</option>
          </select>
        )}
        {styled && (
          <>
            <span className="be-sep" />
            <button type="button" title={t('Bold')} onClick={() => p.onWrap('**')}><b>B</b></button>
            <button type="button" title={t('Italic')} onClick={() => p.onWrap('*')}><i>I</i></button>
            <button type="button" title={t('Underline')} onClick={() => p.onWrap('__')}><u>U</u></button>
            <button type="button" title={t('Strike')} onClick={() => p.onWrap('~~')}><s>S</s></button>
            <button type="button" title={t('Highlight')} onClick={() => p.onWrap('==')}><mark>H</mark></button>
            <button type="button" title={t('Link')} onClick={p.onLink}>🔗</button>
            <span className="be-sep" />
            {(['start', 'center', 'end', 'justify'] as const).map(a => (
              <button
                key={a}
                type="button"
                className={(styled.align ?? 'start') === a ? 'on' : ''}
                title={t({ start: 'Align to the start', center: 'Center', end: 'Align to the end', justify: 'Justify' }[a])}
                onClick={() => p.onChange({ align: a === 'start' ? undefined : a } as Partial<BlogBlock>)}
              >
                {{ start: '⇥', center: '≡', end: '⇤', justify: '☰' }[a]}
              </button>
            ))}
            <button
              type="button"
              title={t('Text direction')}
              onClick={() => p.onChange({ dir: dir === 'rtl' ? 'ltr' : 'rtl' } as Partial<BlogBlock>)}
            >
              {dir === 'rtl' ? 'RTL' : 'LTR'}
            </button>
            <select value={styled.font ?? ''} onChange={e => p.onChange({ font: (e.target.value || undefined) as Styled['font'] } as Partial<BlogBlock>)} aria-label={t('Font')}>
              <option value="">{t('Font')}</option>
              <option value="anjoman">Anjoman (فارسی)</option>
              <option value="serif">Lora (English)</option>
              <option value="sans">Sans (English)</option>
            </select>
            <select value={styled.weight ?? ''} onChange={e => p.onChange({ weight: e.target.value ? Number(e.target.value) : undefined } as Partial<BlogBlock>)} aria-label={t('Weight')}>
              <option value="">{t('Weight')}</option>
              {BLOG_WEIGHTS.map(w => (
                <option key={w} value={w}>{WEIGHT_LABEL[w]} · {w}</option>
              ))}
            </select>
            <select value={styled.size ?? ''} onChange={e => p.onChange({ size: (e.target.value || undefined) as Styled['size'] } as Partial<BlogBlock>)} aria-label={t('Size')}>
              <option value="">{t('Size')}</option>
              <option value="sm">S</option>
              <option value="md">M</option>
              <option value="lg">L</option>
              <option value="xl">XL</option>
            </select>
            <span className="be-colors">
              {COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  className={(styled.color ?? '#2b231f') === c ? 'on' : ''}
                  style={{ background: c }}
                  aria-label={c}
                  onClick={() => p.onChange({ color: c === '#2b231f' ? undefined : c } as Partial<BlogBlock>)}
                />
              ))}
            </span>
          </>
        )}
        <span className="be-grow" />
        <button type="button" title={t('Move up')} disabled={p.i === 0} onClick={() => p.onMove(-1)}>↑</button>
        <button type="button" title={t('Move down')} disabled={p.i === p.count - 1} onClick={() => p.onMove(1)}>↓</button>
        <button type="button" title={t('Delete')} className="be-del" onClick={p.onRemove}>✕</button>
      </div>

      {(b.type === 'paragraph' || b.type === 'heading' || b.type === 'callout' || b.type === 'quote') && (
        <AutoArea
          areaRef={p.areaRef}
          className={`be-text be-text-${b.type}${b.type === 'heading' ? ` h${b.level}` : ''}`}
          dir={dir}
          style={style}
          rows={b.type === 'heading' ? 1 : 3}
          value={b.text}
          placeholder={b.type === 'heading' ? t('Heading') : t('Write here…')}
          onKeyDown={p.onKey}
          onChange={e => p.onChange({ text: e.target.value } as Partial<TextBlock>)}
        />
      )}
      {b.type === 'callout' && (
        <div className="chip-row" style={{ margin: '6px 0 0' }}>
          {(['info', 'tip', 'warn'] as const).map(tone => (
            <button key={tone} type="button" className={`chip ${b.tone === tone ? 'chip-active' : ''}`} onClick={() => p.onChange({ tone } as Partial<BlogBlock>)}>
              {t({ info: 'Info', tip: 'Tip', warn: 'Warning' }[tone])}
            </button>
          ))}
        </div>
      )}
      {b.type === 'quote' && (
        <input className="be-small" dir={dir} placeholder={t('Who said it (optional)')} value={b.cite} onChange={e => p.onChange({ cite: e.target.value } as Partial<BlogBlock>)} />
      )}
      {b.type === 'list' && (
        <>
          <AutoArea
            areaRef={p.areaRef}
            className="be-text"
            dir={dir}
            style={style}
            rows={3}
            value={b.items.join('\n')}
            placeholder={t('One item per line')}
            onKeyDown={p.onKey}
            onChange={e => p.onChange({ items: e.target.value.split('\n') } as Partial<BlogBlock>)}
          />
          <label className="site-check">
            <input type="checkbox" checked={b.ordered} onChange={e => p.onChange({ ordered: e.target.checked } as Partial<BlogBlock>)} />
            <span>{t('Numbered')}</span>
          </label>
        </>
      )}
      {b.type === 'image' && (
        <div className="be-image">
          <img src={mediaUrl(b.mediaId)} alt="" className={`w-${b.width}`} />
          <input className="be-small" dir={p.defaultDir} placeholder={t('Caption (optional)')} value={b.caption} onChange={e => p.onChange({ caption: e.target.value } as Partial<BlogBlock>)} />
          <input className="be-small" dir={p.defaultDir} placeholder={t('Describe the picture (for Google and screen readers)')} value={b.alt} onChange={e => p.onChange({ alt: e.target.value } as Partial<BlogBlock>)} />
          <div className="chip-row" style={{ margin: 0 }}>
            {(['normal', 'wide', 'full'] as const).map(w => (
              <button key={w} type="button" className={`chip ${b.width === w ? 'chip-active' : ''}`} onClick={() => p.onChange({ width: w } as Partial<BlogBlock>)}>
                {t({ normal: 'Normal', wide: 'Wide', full: 'Full width' }[w])}
              </button>
            ))}
            <button type="button" className="chip" onClick={p.onReplaceImage}>{t('Change picture')}</button>
          </div>
        </div>
      )}
      {b.type === 'button' && (
        <div className="be-grid">
          <input className="be-small" dir={p.defaultDir} placeholder={t('Button text')} value={b.label} maxLength={80} onChange={e => p.onChange({ label: e.target.value } as Partial<BlogBlock>)} />
          <input className="be-small ltr" placeholder="https://app.purrpose.ir" value={b.url} onChange={e => p.onChange({ url: e.target.value } as Partial<BlogBlock>)} />
        </div>
      )}
      {b.type === 'divider' && <hr className="be-hr" />}
      <AddMenu onPick={p.onAdd} />
    </div>
  );
}
