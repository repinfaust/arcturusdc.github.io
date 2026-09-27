'use client';

// Squared — job-search triage for people leaving the Armed Forces (D-SITE-034).
// Same engine as Career Ops (src/lib/careerEngine) with its own collections,
// prompts and forces features. Design: planning/design/career-ops-forces.
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTenant } from '@/contexts/TenantContext';
import { extractCvText } from '@/lib/careerEngine/cvParse';
import { squaredApi, squaredCheckout } from './_components/api';
import { MONO, CAPS } from './_components/ui';
import Onboarding from './_components/Onboarding';
import Paywall from './_components/Paywall';
import PipelineTab from './_components/tabs/PipelineTab';
import ScansTab from './_components/tabs/ScansTab';
import CvTab from './_components/tabs/CvTab';
import ApplyTab from './_components/tabs/ApplyTab';
import ConfigTab from './_components/tabs/ConfigTab';

// Tab <-> URL path mapping for deep-linkable sub-pages. Never name a route
// folder "cvs": Vercel's default ignore list drops it (D-SITE-032).
const TAB_BASE = '/apps/stea/squared';
const TABS = [
  ['pipeline', 'Pipeline', TAB_BASE],
  ['scans', 'Live Scans', `${TAB_BASE}/scans`],
  ['cvs', 'CV Tailoring', `${TAB_BASE}/cv-library`],
  ['apply', 'Apply Assist', `${TAB_BASE}/apply`],
  ['settings', 'Config', `${TAB_BASE}/setup`],
];

// Timed UX stages so the multi-second LLM round trips don't look like a hang.
function useStages(active, count, ms) {
  const [stage, setStage] = useState(0);
  useEffect(() => {
    setStage(0);
    if (!active) return;
    const id = setInterval(() => setStage((s) => Math.min(s + 1, count - 1)), ms);
    return () => clearInterval(id);
  }, [active, count, ms]);
  return stage;
}

const EMPTY_PROFILE = {
  name: '', location: '', current_role: '', min_salary: '', target_roles: [],
  service_branch: 'British Army', trade: '', rank: '', years_served: '', clearance: 'None',
  exit_date: '', notice_date: '',
};

export default function SquaredApp({ initialTab = 'pipeline' }) {
  const { currentTenant, loading: tenantLoading } = useTenant();
  const tenantId = currentTenant?.id;
  const pathname = usePathname();

  // Tabs switch in place and only rewrite the URL. router.push would change
  // route segment, remounting this component: every tab change refetched all
  // data and re-ran the first-run tour check. Next 14.2 syncs usePathname with
  // native pushState, so Back/Forward still move between tabs.
  const [tab, setTabState] = useState(initialTab);
  const setTab = (id) => {
    setTabState(id);
    const path = TABS.find((t) => t[0] === id)?.[2] || TAB_BASE;
    if (typeof window !== 'undefined' && window.location.pathname !== path) window.history.pushState(null, '', path);
  };
  useEffect(() => {
    const match = TABS.find((t) => t[2] === pathname);
    if (match && match[0] !== tab) setTabState(match[0]);
  }, [pathname]);

  // Config
  const [configStatus, setConfigStatus] = useState({ loading: true, has_config: false });
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [anchors, setAnchors] = useState([]);
  const [translations, setTranslations] = useState([]);
  const [saving, setSaving] = useState('');

  // Pipeline / analysis
  const [jdText, setJdText] = useState('');
  const [analysing, setAnalysing] = useState(false);
  const [results, setResults] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [tailoring, setTailoring] = useState(false);
  const [cvLibrary, setCvLibrary] = useState([]);
  const analyseStage = useStages(analysing, 5, 4000);
  const tailorStage = useStages(tailoring, 5, 5000);

  // Search
  const [search, setSearch] = useState({ keywords: '', location: '', salary: '', mode: 'both', excludeService: false });
  const [searching, setSearching] = useState(false);
  const [searchOut, setSearchOut] = useState(null);
  const searchStage = useStages(searching, 4, 3000);
  const [searchPrefilled, setSearchPrefilled] = useState(false);

  // CV uploads
  const [cvUploads, setCvUploads] = useState([]);
  const [cvBusy, setCvBusy] = useState(false);

  // Apply Assist
  const [applyExtras, setApplyExtras] = useState({});
  const [applyDirty, setApplyDirty] = useState(false);
  const [applyRoleId, setApplyRoleId] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [coverLoading, setCoverLoading] = useState(false);
  const [applyAnswers, setApplyAnswers] = useState([]);
  const [answersLoading, setAnswersLoading] = useState(false);

  // Metering + onboarding
  const [usage, setUsage] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const api = (action, payload) => squaredApi(tenantId, action, payload);

  // Returns true if a response was the usage limit (402); shows the paywall.
  function handleLimit(res, data) {
    if (res.status === 402 || data?.limit_reached) {
      if (data?.usage) setUsage((u) => ({ ...(u || {}), ...data.usage }));
      setShowPaywall(true);
      return true;
    }
    return false;
  }

  useEffect(() => {
    if (!tenantId) return;
    loadConfig();
    loadAnalyses();
    loadCvs();
    loadUsage();
    loadApplyExtras();
    loadCvUploads();
    loadOnboarding();
    // Returning from a coffee purchase: refresh usage (webhook may lag) and clean the URL.
    if (typeof window !== 'undefined' && window.location.search.includes('coffee=success')) {
      setTimeout(loadUsage, 1500);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [tenantId]);

  async function loadConfig() {
    try {
      const { data } = await api('get_config');
      setConfigStatus({ loading: false, has_config: !!data.has_config });
      const p = data.profile_obj && typeof data.profile_obj === 'object' ? { ...EMPTY_PROFILE, ...data.profile_obj } : null;
      if (p) setProfile(p);
      if (Array.isArray(data.evidence_obj)) setAnchors(data.evidence_obj);
      if (Array.isArray(data.skills_translations)) setTranslations(data.skills_translations);
      if (p && !searchPrefilled) {
        setSearch((s) => ({
          ...s,
          keywords: (Array.isArray(p.target_roles) && p.target_roles[0]) || s.keywords,
          location: p.location ? String(p.location).split(',')[0].trim() : s.location,
        }));
        // No salary prefill: a floor hides every listing without a salary (most).
        setSearchPrefilled(true);
      }
    } catch (err) {
      console.error('Failed to load config', err);
      setConfigStatus({ loading: false, has_config: false });
    }
  }

  // Profile and evidence save independently; the engine only writes fields sent.
  async function saveConfig(what, fields) {
    setSaving(what);
    try {
      const { res, data } = await api('save_config', fields);
      if (!res.ok) throw new Error(data.error || 'Save failed');
      await loadConfig();
      return true;
    } catch (err) {
      alert('Save failed: ' + err.message);
      return false;
    } finally {
      setSaving('');
    }
  }

  const saveProfile = (what) => {
    // Prompts read current_role; derive it from the service record if unset.
    const derived = profile.current_role || [profile.rank, profile.trade].filter(Boolean).join(', ');
    return saveConfig(what, { profile_obj: { ...profile, current_role: derived } });
  };
  // `next` lets a caller save a list it has just built, before state updates land.
  const saveAnchors = (next) => {
    const list = Array.isArray(next) ? next : anchors;
    if (Array.isArray(next)) setAnchors(next);
    return saveConfig('anchors', {
      evidence_obj: list.map((a) => ({ ...a, bullets: (a.bullets || []).map((b) => b.trim()).filter(Boolean) })),
    });
  };
  const saveTranslations = (next) => {
    setTranslations(next);
    return api('save_config', { skills_translations: next });
  };

  async function loadAnalyses() {
    const { res, data } = await api('list_analyses');
    if (res.ok && Array.isArray(data.analyses)) setPipeline(data.analyses);
  }
  async function loadCvs() {
    const { res, data } = await api('list_cvs');
    if (res.ok && Array.isArray(data.cvs)) setCvLibrary(data.cvs);
  }
  async function loadUsage() {
    const { res, data } = await api('get_usage');
    if (res.ok) setUsage(data);
  }
  async function loadOnboarding() {
    const { res, data } = await api('get_onboarding');
    if (res.ok && !data.onboarding_dismissed) setShowOnboarding(true);
  }
  async function dismissOnboarding() {
    setShowOnboarding(false);
    await api('dismiss_onboarding');
  }

  async function analyse(overrideText) {
    const input = (typeof overrideText === 'string' ? overrideText : jdText).trim();
    if (!input || !tenantId) return;
    setAnalysing(true);
    setResults(null);
    try {
      const { res, data } = await api('analyse', { jd_text: input });
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Analyse failed');
      setResults(data);
      loadAnalyses();
      loadUsage();
    } catch (err) {
      alert(err.message);
    } finally {
      setAnalysing(false);
    }
  }

  async function openAnalysis(id) {
    setTab('pipeline');
    const { res, data } = await api('get_analysis', { id });
    if (res.ok) {
      setResults({ id: data.id, jd_data: data.jd_data, evaluation: data.evaluation, score: data.score, tailored_cv: data.tailored_cv });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  async function tailorCv(id) {
    if (!id) return;
    setTailoring(true);
    try {
      const { res, data } = await api('tailor_cv', { id });
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Tailoring failed');
      setResults((r) => ({ ...r, tailored_cv: data.tailored_cv }));
      loadAnalyses();
      loadCvs();
      loadUsage();
    } catch (err) {
      alert(err.message);
    } finally {
      setTailoring(false);
    }
  }

  async function searchJobs() {
    if (!tenantId) return;
    setSearching(true);
    setSearchOut(null);
    const keywords = search.keywords.trim() || (profile.target_roles || [])[0] || '';
    // Optional: exclude the MOD and the user's own service. Off by default: a
    // leaver's chain of command already knows they're going (D-SITE-036).
    const exclude_employer = search.excludeService
      ? ['Ministry of Defence', profile.service_branch].filter(Boolean)
      : [];
    try {
      const { res, data } = await api('search_jobs', {
        keywords,
        location: search.location.trim(),
        salary_min: search.salary ? Number(search.salary) : undefined,
        exclude_employer,
        mode: search.mode,
      });
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setSearchOut(data);
      loadUsage();
    } catch (err) {
      alert(err.message);
    } finally {
      setSearching(false);
    }
  }

  function analyseFromSearch(job) {
    if (!job?.url) { alert('This listing has no link to analyse. Open it and paste the description instead.'); return; }
    setTab('pipeline');
    setJdText(job.url);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    analyse(job.url);
  }

  // --- CV library ---
  async function loadCvUploads() {
    const { res, data } = await api('list_cv_uploads');
    if (res.ok && Array.isArray(data.cvs)) setCvUploads(data.cvs);
  }
  async function saveCvAndExtract(label, cvText) {
    if (!cvText?.trim()) { alert('No text found in that file. Try another file or paste the text.'); return; }
    setCvBusy(true);
    try {
      const saved = await api('save_cv', { label, cv_text: cvText, make_active: true });
      if (!saved.res.ok) throw new Error(saved.data.error || 'Save failed');
      await loadCvUploads();
      if (window.confirm('CV saved and set as active. Fill your service record, profile and evidence from it now? (uses one action — you can review and edit before saving)')) {
        const { res, data } = await api('extract_from_cv', { id: saved.data.id });
        if (handleLimit(res, data)) return;
        if (!res.ok) throw new Error(data.error || 'Extraction failed');
        if (data.profile) {
          const filled = Object.fromEntries(Object.entries(data.profile).filter(([, v]) => v !== '' && v != null));
          setProfile((p) => ({ ...p, ...filled }));
        }
        if (Array.isArray(data.evidence) && data.evidence.length) setAnchors(data.evidence);
        loadUsage();
        setTab('settings');
        alert('Filled from your CV. Review each section and hit Save.');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setCvBusy(false);
    }
  }
  async function handleCvFile(file) {
    if (!file) return;
    setCvBusy(true);
    try {
      const text = await extractCvText(file);
      await saveCvAndExtract(file.name.replace(/\.(pdf|docx|txt)$/i, ''), text);
    } catch (err) {
      alert(err.message);
    } finally {
      setCvBusy(false);
    }
  }
  async function setActiveCv(id) { await api('set_active_cv', { id }); loadCvUploads(); }
  async function relabelCv(id, current) {
    const label = window.prompt('Label for this CV:', current || '');
    if (label == null) return;
    await api('relabel_cv', { id, label });
    loadCvUploads();
  }
  async function deleteCv(id) {
    if (!window.confirm('Delete this CV from your library?')) return;
    await api('delete_cv', { id });
    loadCvUploads();
  }

  // --- Skills translator ---
  async function translateLine(text) {
    const { res, data } = await api('translate_skill', { text });
    if (handleLimit(res, data)) return null;
    if (!res.ok) { alert(data.error || 'Translation failed'); return null; }
    loadUsage();
    return data;
  }

  // Whole-record translation: returns reviewable lines; nothing is saved here.
  async function translateRecord(text) {
    const { res, data } = await api('translate_record', { text });
    if (handleLimit(res, data)) return null;
    if (!res.ok) { alert(data.error || 'Translation failed'); return null; }
    loadUsage();
    return data;
  }

  // --- Apply Assist ---
  async function loadApplyExtras() {
    const { res, data } = await api('get_apply_profile');
    if (res.ok && data.apply_profile) setApplyExtras(data.apply_profile);
  }
  async function saveApplyExtras() {
    const { res, data } = await api('save_apply_profile', { apply_profile: applyExtras });
    if (!res.ok) { alert('Could not save: ' + (data.error || res.status)); return; }
    setApplyDirty(false);
  }
  const setExtra = (key, val) => { setApplyExtras((e) => ({ ...e, [key]: val })); setApplyDirty(true); };

  function openApplyAssist(id) {
    setApplyRoleId(id || '');
    setTab('apply');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  useEffect(() => {
    setCoverLetter('');
    setApplyAnswers([]);
    if (!tenantId || !applyRoleId) return;
    (async () => {
      const { res, data } = await api('get_analysis', { id: applyRoleId });
      if (res.ok) {
        if (data.cover_letter) setCoverLetter(data.cover_letter);
        if (Array.isArray(data.apply_answers)) setApplyAnswers(data.apply_answers);
      }
    })();
  }, [applyRoleId, tenantId]);

  async function generateCoverLetter(editInstruction) {
    if (!applyRoleId) { alert('Select a role first.'); return; }
    setCoverLoading(true);
    try {
      const { res, data } = await api('cover_letter', { id: applyRoleId, edit_instruction: editInstruction || '' });
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Cover letter failed');
      setCoverLetter(data.cover_letter || '');
      loadUsage();
    } catch (err) {
      alert(err.message);
    } finally {
      setCoverLoading(false);
    }
  }
  async function generateAnswers() {
    if (!applyRoleId) { alert('Select a role first.'); return; }
    setAnswersLoading(true);
    try {
      const { res, data } = await api('apply_answers', { id: applyRoleId });
      if (handleLimit(res, data)) return;
      if (!res.ok) throw new Error(data.error || 'Failed');
      setApplyAnswers(data.apply_answers || []);
      loadUsage();
    } catch (err) {
      alert(err.message);
    } finally {
      setAnswersLoading(false);
    }
  }

  // --- Paywall ---
  async function buyCoffee() {
    const { data } = await squaredCheckout(tenantId);
    if (data?.url) { window.location.href = data.url; return; }
    alert(data?.error || 'Could not start checkout.');
  }
  async function redeemCode() {
    const code = window.prompt('Enter your access code:');
    if (!code) return;
    const { res, data } = await api('redeem_code', { code });
    if (!res.ok) { alert(data.error || 'Invalid code'); return; }
    setShowPaywall(false);
    loadUsage();
    alert("Code accepted — you're all set.");
  }

  if (tenantLoading || (tenantId && configStatus.loading)) {
    return <div className="p-10 text-center text-[#686c62] font-medium">Initialising Squared…</div>;
  }
  if (!tenantId) {
    return <div className="p-10 text-center text-[#686c62] font-medium">Select a workspace to use Squared.</div>;
  }

  const usageLabel = usage?.unlimited
    ? 'Unlimited (admin)'
    : usage
      ? (usage.remaining > 0 ? `${usage.remaining} actions left ☕` : 'No actions left — buy a brew ☕')
      : '';

  return (
    <div>
      {/* Tabs + usage + help */}
      <div className="flex flex-wrap items-stretch gap-2.5">
        <nav className="flex-1 flex flex-wrap border border-[#22251f] bg-[#fffdf8] min-w-0">
          {TABS.map(([id, label], i) => {
            const on = id === tab;
            return (
              <button key={id} onClick={() => setTab(id)}
                className={`flex items-center gap-2.5 px-4 py-3 border-r border-[#d7cebc] whitespace-nowrap text-sm font-bold ${on ? 'bg-[#22251f] text-[#f8f4ea]' : 'bg-transparent text-[#686c62]'}`}>
                <span className={`${MONO} text-xs sm:text-[11px] font-semibold ${on ? 'text-[#b9c7ab]' : 'text-[#686c62]'}`}>{String(i + 1).padStart(2, '0')}</span>
                {label}
              </button>
            );
          })}
        </nav>
        {usageLabel && (
          <button onClick={() => !usage?.unlimited && setShowPaywall(true)} title="Analyses, CV tailoring, searches and translations each use one action"
            className={`px-3.5 py-2.5 border border-[#d7cebc] bg-[#fffdf8] text-[13px] sm:text-xs font-extrabold whitespace-nowrap ${usage?.remaining === 0 ? 'text-[#C63C00]' : 'text-[#686c62]'}`}>
            {usageLabel}
          </button>
        )}
        <button onClick={() => setShowOnboarding(true)} title="How it works"
          className="w-[46px] border border-[#d7cebc] bg-[#fffdf8] text-base font-extrabold text-[#4c5c3f]">?</button>
      </div>

      {!configStatus.has_config && tab !== 'settings' && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 p-4 border border-[#d9b8a6] bg-[#f3e5dc]">
          <div>
            <div className="text-sm font-extrabold text-[#5a3c2f]">Set up first</div>
            <p className="text-[13px] text-[#5a3c2f] mt-0.5">Add your service record, profile and evidence in Config before analysing roles.</p>
          </div>
          <button onClick={() => setTab('settings')} className={`px-4 py-2.5 bg-[#22251f] text-[#f8f4ea] ${CAPS}`}>Go to Config</button>
        </div>
      )}

      {tab === 'pipeline' && (
        <PipelineTab
          hasConfig={configStatus.has_config}
          jdText={jdText} setJdText={setJdText}
          analyse={analyse} analysing={analysing} analyseStage={analyseStage}
          results={results} clearResults={() => setResults(null)}
          pipeline={pipeline} openAnalysis={openAnalysis} openApplyAssist={openApplyAssist}
          tailorCv={tailorCv} tailoring={tailoring} tailorStage={tailorStage}
          profile={profile} goCvs={() => setTab('cvs')}
          openOnboarding={() => setShowOnboarding(true)}
        />
      )}
      {tab === 'scans' && (
        <ScansTab
          search={search} setSearch={setSearch} searchJobs={searchJobs}
          searching={searching} searchStage={searchStage} searchOut={searchOut}
          analyseFromSearch={analyseFromSearch} analysing={analysing}
          serviceBranch={profile.service_branch}
        />
      )}
      {tab === 'cvs' && <CvTab cvLibrary={cvLibrary} profile={profile} goPipeline={() => setTab('pipeline')} />}
      {tab === 'apply' && (
        <ApplyTab
          profile={profile} anchors={anchors} pipeline={pipeline}
          applyExtras={applyExtras} setExtra={setExtra} applyDirty={applyDirty} saveApplyExtras={saveApplyExtras}
          applyRoleId={applyRoleId} setApplyRoleId={setApplyRoleId}
          coverLetter={coverLetter} coverLoading={coverLoading} generateCoverLetter={generateCoverLetter}
          applyAnswers={applyAnswers} answersLoading={answersLoading} generateAnswers={generateAnswers}
        />
      )}
      {tab === 'settings' && (
        <ConfigTab
          profile={profile} setProfile={setProfile} saveProfile={saveProfile}
          anchors={anchors} setAnchors={setAnchors} saveAnchors={saveAnchors}
          translations={translations} saveTranslations={saveTranslations} translateLine={translateLine}
          translateRecord={translateRecord} usage={usage}
          saving={saving}
          cvUploads={cvUploads} cvBusy={cvBusy} handleCvFile={handleCvFile} saveCvAndExtract={saveCvAndExtract}
          setActiveCv={setActiveCv} relabelCv={relabelCv} deleteCv={deleteCv}
        />
      )}

      {showOnboarding && (
        <Onboarding
          onClose={() => setShowOnboarding(false)}
          onDismiss={dismissOnboarding}
          onFinish={dismissOnboarding}
          onGoConfig={() => { setShowOnboarding(false); setTab('settings'); }}
        />
      )}
      {showPaywall && (
        <Paywall usage={usage} onClose={() => setShowPaywall(false)} onBuy={buyCoffee} onRedeem={redeemCode} />
      )}
    </div>
  );
}
