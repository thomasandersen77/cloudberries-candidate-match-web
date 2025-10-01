import {useEffect, useMemo, useRef, useState} from 'react';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    Autocomplete,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Grid,
    Link as MuiLink,
    Paper,
    Stack,
    TextField,
    Tooltip,
    Typography,
    FormControlLabel,
    Switch,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {searchChat} from '../../services/chatService';
import { listConsultants, listConsultantCvs, getConsultantByUserId } from '../../services/consultantsService';
import type {ChatSearchRequest, ChatSearchResponse, DebugInfo, SearchResult, ConsultantSummaryDto} from '../../types/api';

// Helpers
const DELAYED_SPINNER_MS = 500;
const CHAT_SEARCH_CONV_KEY = 'chat.search.conversationId';
const CHAT_FORCE_MODE_KEY = 'chat.search.forceMode';
const CHAT_TOPK_KEY = 'chat.search.topK';
const CHAT_RECENTS_KEY = 'chat.recentConsultants';
const CHAT_PINNED_KEY = 'chat.pinnedConsultants';
const CHAT_REMEMBER_KEY = 'chat.rememberSelection';
const CHAT_REMEMBER_UID = 'chat.remember.userId';
const CHAT_REMEMBER_CVID = 'chat.remember.cvId';

function formatScoreToPercent(score: number | undefined): string {
    if (typeof score !== 'number' || isNaN(score)) return '-';
    const pct = Math.round(Math.max(0, Math.min(1, score)) * 100);
    return `${pct}%`;
}

function resolveUserId(result: SearchResult): string | undefined {
    const meta = result.meta as Record<string, unknown> | undefined;
    const metaUserId = typeof meta?.userId === 'string' ? meta?.userId : undefined;
    return metaUserId || result.consultantId || undefined;
}

const buildConsultantLink = (userId?: string) => (userId ? `/consultants/${userId}` : undefined);
const buildCvLink = (userId?: string) => (userId ? `/cv/${userId}` : undefined);

type ForceMode = 'AUTO' | 'STRUCTURED' | 'SEMANTIC' | 'HYBRID' | 'RAG';

const ChatSearchTab = () => {
    const [text, setText] = useState('');
    const [forceMode, setForceMode] = useState<ForceMode>('AUTO');
    const [topK, setTopK] = useState<number>(10);
    const [conversationId, setConversationId] = useState<string | undefined>(undefined);

    const [response, setResponse] = useState<ChatSearchResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSpinner, setShowSpinner] = useState(false);
    const [latency, setLatency] = useState<number | null>(null);

    // Consultant targeting
    const [consultantQuery, setConsultantQuery] = useState('');
    const [consultantOptions, setConsultantOptions] = useState<ConsultantSummaryDto[]>([]);
    const [selectedConsultant, setSelectedConsultant] = useState<ConsultantSummaryDto | null>(null);
    const [selectedCvId, setSelectedCvId] = useState<string>('');
    const [cvOptions, setCvOptions] = useState<{ id?: number | null; versionTag?: string | null; active: boolean; qualityScore?: number | null }[]>([]);
    const [pinned, setPinned] = useState<ConsultantSummaryDto[]>([]);
    const [rememberSelection, setRememberSelection] = useState<boolean>(false);
    const [useActiveCv, setUseActiveCv] = useState<boolean>(false);
    const spinnerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // load saved conversation and persisted prefs
    useEffect(() => {
        try {
            const saved = sessionStorage.getItem(CHAT_SEARCH_CONV_KEY);
            if (saved) setConversationId(saved);
        } catch { /* empty */ }
        try {
            const fm = localStorage.getItem(CHAT_FORCE_MODE_KEY) as ForceMode | null;
            if (fm && ['AUTO','STRUCTURED','SEMANTIC','HYBRID','RAG'].includes(fm)) setForceMode(fm);
        } catch { /* empty */ }
        try {
            const tk = Number(localStorage.getItem(CHAT_TOPK_KEY));
            if (!Number.isNaN(tk) && tk >= 1 && tk <= 100) setTopK(tk);
        } catch { /* empty */ }
        try {
            const storedPinned: ConsultantSummaryDto[] = JSON.parse(localStorage.getItem(CHAT_PINNED_KEY) || '[]');
            setPinned(storedPinned);
        } catch { /* empty */ }
        try {
            const rem = localStorage.getItem(CHAT_REMEMBER_KEY);
            if (rem === 'true') {
                // we'll try to restore later
                setRememberSelection(true);
            }
        } catch { /* empty */ }
    }, []);

    // persist prefs
    useEffect(() => {
        try { localStorage.setItem(CHAT_FORCE_MODE_KEY, forceMode); } catch { /* empty */ }
    }, [forceMode]);
    useEffect(() => {
        try { localStorage.setItem(CHAT_TOPK_KEY, String(topK)); } catch { /* empty */ }
    }, [topK]);

    // when consultant changes, fetch CV options and persist selection in session
    useEffect(() => {
        (async () => {
            if (!selectedConsultant?.userId) { setCvOptions([]); return; }
            try {
                const cvs = await listConsultantCvs(selectedConsultant.userId);
                setCvOptions(cvs ?? []);
                if (!selectedCvId && selectedConsultant.defaultCvId) {
                    setSelectedCvId(selectedConsultant.defaultCvId);
                }
            } catch { /* ignore */ }
            try {
                sessionStorage.setItem('chat.target.userId', selectedConsultant.userId);
                sessionStorage.setItem('chat.target.name', selectedConsultant.name);
                sessionStorage.setItem('chat.target.defaultCvId', selectedConsultant.defaultCvId ?? '');
                if (rememberSelection) {
                    localStorage.setItem(CHAT_REMEMBER_UID, selectedConsultant.userId);
                }
            } catch { /* empty */ }
        })();
    }, [selectedConsultant, rememberSelection, selectedCvId]);

    useEffect(() => {
        try { sessionStorage.setItem('chat.target.cvId', selectedCvId || ''); } catch { /* empty */ }
        try { if (rememberSelection) localStorage.setItem(CHAT_REMEMBER_CVID, selectedCvId || ''); } catch { /* empty */ }
    }, [selectedCvId, rememberSelection]);

    // cleanup timer on unmounting
    useEffect(() => () => {
        if (spinnerTimer.current) clearTimeout(spinnerTimer.current);
    }, []);

    const isRag = response?.mode === 'RAG';
    const items: SearchResult[] = useMemo(() => response?.results ?? [], [response]);
    const debug: DebugInfo | undefined = response?.debug;
    const scoring = response?.scoring as any;

    const startSpinnerTimer = () => {
        if (spinnerTimer.current) clearTimeout(spinnerTimer.current);
        spinnerTimer.current = setTimeout(() => setShowSpinner(true), DELAYED_SPINNER_MS);
    };

    // consultant search (debounced) + recent history + pinned on top
    useEffect(() => {
        const h = setTimeout(async () => {
            const q = consultantQuery.trim().toLowerCase();
            let recent: ConsultantSummaryDto[] = [];
            try {
                recent = JSON.parse(localStorage.getItem(CHAT_RECENTS_KEY) || '[]');
            } catch { /* empty */ }
            const pin = pinned;
            const matches = (c: ConsultantSummaryDto) => (
                !q || c.name.toLowerCase().includes(q) || c.userId.toLowerCase().includes(q)
            );
            if (!q) {
                const options = [
                    ...pin,
                    ...recent.filter(r => !pin.find(p => p.userId === r.userId))
                ];
                setConsultantOptions(options);
                return;
            }
            try {
                const res = await listConsultants({ name: q, page: 0, size: 10 });
                const list = res.content ?? [];
                const options = [
                    ...pin.filter(matches),
                    ...list.filter(r => !pin.find(p => p.userId === r.userId))
                ];
                setConsultantOptions(options);
            } catch {
                const options = [
                    ...pin.filter(matches),
                    ...recent.filter(r => !pin.find(p => p.userId === r.userId) && matches(r))
                ];
                setConsultantOptions(options);
            }
        }, 300);
        return () => clearTimeout(h);
    }, [consultantQuery, pinned]);

    // on mount, if rememberSelection is true, try to restore selection from storage
    useEffect(() => {
        (async () => {
            if (!rememberSelection) return;
            try {
                const uid = localStorage.getItem(CHAT_REMEMBER_UID);
                if (!uid) return;
                const cvid = localStorage.getItem(CHAT_REMEMBER_CVID) || '';
                // try pinned or recents first
                const recent: ConsultantSummaryDto[] = JSON.parse(localStorage.getItem(CHAT_RECENTS_KEY) || '[]');
                const pin: ConsultantSummaryDto[] = JSON.parse(localStorage.getItem(CHAT_PINNED_KEY) || '[]');
                let found = pin.find(p => p.userId === uid) || recent.find(r => r.userId === uid);
                if (!found) {
                    try { found = await getConsultantByUserId(uid); } catch { /* ignore */ }
                }
                if (found) {
                    setSelectedConsultant(found);
                    if (cvid) setSelectedCvId(cvid);
                }
            } catch { /* empty */ }
        })();
    }, [rememberSelection]);
// ... existing code ...
    const validateInput = (text: string, isSubmitting: boolean): string | null => {
        const trimmed = text.trim();
        if (!trimmed) return null;
        if (isSubmitting) return null;
        return trimmed;
    };

    const buildSearchPayload = (
        trimmedText: string,
        conversationId: string | undefined,
        forceMode: ForceMode
    ): ChatSearchRequest => {
        const payload: ChatSearchRequest = {
            text: trimmedText,
            topK: Math.max(1, Math.min(100, Number.isFinite(topK) ? topK : 10)),
        };

        if (selectedConsultant?.userId) {
            payload.consultantId = selectedConsultant.userId;
        }
        if (!useActiveCv && selectedCvId) {
            payload.cvId = selectedCvId;
        }

        if (conversationId) {
            payload.conversationId = conversationId;
        }

        if (forceMode !== 'AUTO') {
            payload.forceMode = forceMode as ChatSearchRequest['forceMode'];
        }

        return payload;
    };

    const handleSearchSuccess = (
        res: ChatSearchResponse,
        setResponse: (response: ChatSearchResponse) => void,
        setConversationId: (id: string) => void,
        setLatency: (latency: number) => void
    ) => {
        setResponse(res);

        if (res.conversationId) {
            setConversationId(res.conversationId);
            try {
                sessionStorage.setItem(CHAT_SEARCH_CONV_KEY, res.conversationId);
            } catch { /* empty */
            }
        }

        setLatency(res.latencyMs);
    };

    const onSubmit = async () => {
        const trimmedText = validateInput(text, isSubmitting);
        if (!trimmedText) return;

        setError(null);
        setResponse(null);
        setLatency(null);
        setIsSubmitting(true);
        startSpinnerTimer();

        try {
            const payload = buildSearchPayload(trimmedText, conversationId, forceMode);
            const res = await searchChat(payload);
            handleSearchSuccess(res, setResponse, setConversationId, setLatency);

        } catch (e) {
            console.log(e)
        }
    };

    const onNewConversation = () => {
        setConversationId(undefined);
        setResponse(null);
        setError(null);
        setLatency(null);
        setText('');
        try {
            sessionStorage.removeItem(CHAT_SEARCH_CONV_KEY);
        } catch { /* empty */
        }
    };


    return (
        <Container sx={{px: 0}}>
            <Paper sx={{p: 2, mb: 2}}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                        <Autocomplete
                            options={consultantOptions}
                            getOptionLabel={(o) => `${o.name} (${o.userId})`}
                            onInputChange={(_, val) => setConsultantQuery(val)}
                            onChange={(_, val) => {
                                setSelectedConsultant(val);
                                setSelectedCvId(val?.defaultCvId ?? '');
                                // update recent list
                                try {
                                    if (val) {
                                        const prev: ConsultantSummaryDto[] = JSON.parse(localStorage.getItem(CHAT_RECENTS_KEY) || '[]');
                                        const next = [val, ...prev.filter(x => x.userId !== val.userId)].slice(0, 8);
                                        localStorage.setItem(CHAT_RECENTS_KEY, JSON.stringify(next));
                                    }
                                } catch { /* empty */ }
                            }}
                            value={selectedConsultant}
                            renderInput={(params) => (
                                <TextField {...params} label="Konsulent" placeholder="Søk etter navn" size="small" />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Autocomplete
                            options={cvOptions}
                            getOptionLabel={(o) => `${o.versionTag || 'default'}${o.active ? ' (active)' : ''}${typeof o.qualityScore === 'number' ? ` • score ${o.qualityScore}` : ''}`}
                            value={useActiveCv ? null : (cvOptions.find(o => (o.versionTag || 'default') === (selectedCvId || '')) || null)}
                            onChange={(_, val) => setSelectedCvId((val?.versionTag || 'default') as string)}
                            renderInput={(params) => (
                                <TextField {...params} label="CV" placeholder="Velg CV" size="small" />
                            )}
                            disabled={useActiveCv}
                        />
                        <FormControlLabel
                            control={<Switch size="small" checked={useActiveCv} onChange={(e) => setUseActiveCv(e.target.checked)} />}
                            label="Bruk aktiv CV"
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField
                            label="Skriv spørsmålet ditt"
                            placeholder="f.eks. Finn konsulenter som kan Kotlin og Spring"
                            fullWidth
                            multiline
                            minRows={2}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                            {sampleQueries.map(q => (
                                <Chip
                                    key={q.label}
                                    label={q.label}
                                    size="small"
                                    onClick={() => { setText(q.text); setForceMode(q.mode); setTopK(q.topK ?? topK); setSelectedConsultant(null); }}
                                />
                            ))}
                        </Stack>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                            {(['AUTO','STRUCTURED','SEMANTIC','HYBRID','RAG'] as ForceMode[]).map(m => (
                                <Chip
                                    key={m}
                                    label={m}
                                    color={forceMode === m ? 'primary' : 'default'}
                                    size="small"
                                    onClick={() => setForceMode(m)}
                                />
                            ))}
                            {/* Pin/Unpin and Clear Recent controls */}
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={() => {
                                    if (!selectedConsultant) return;
                                    const exists = pinned.find(p => p.userId === selectedConsultant.userId);
                                    let next: ConsultantSummaryDto[];
                                    if (exists) {
                                        next = pinned.filter(p => p.userId !== selectedConsultant.userId);
                                    } else {
                                        next = [selectedConsultant, ...pinned.filter(p => p.userId !== selectedConsultant.userId)].slice(0, 8);
                                    }
                                    setPinned(next);
                                    try { localStorage.setItem(CHAT_PINNED_KEY, JSON.stringify(next)); } catch { /* empty */ }
                                }}
                            >
                                {selectedConsultant && pinned.find(p => p.userId === selectedConsultant.userId) ? 'Unpin' : 'Pin'}
                            </Button>
                            <Button
                                size="small"
                                color="warning"
                                variant="text"
                                onClick={() => {
                                    try { localStorage.setItem(CHAT_RECENTS_KEY, '[]'); } catch { /* empty */ }
                                    // Refresh list with pinned only when no query
                                    if (!consultantQuery.trim()) setConsultantOptions(pinned);
                                }}
                            >
                                Clear recent
                            </Button>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">Tving modus</Typography>
                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                            <Chip
                                label={rememberSelection ? 'Remember: ON' : 'Remember: OFF'}
                                color={rememberSelection ? 'primary' : 'default'}
                                size="small"
                                onClick={() => {
                                    const next = !rememberSelection;
                                    setRememberSelection(next);
                                    try { localStorage.setItem(CHAT_REMEMBER_KEY, String(next)); } catch { /* empty */ }
                                    if (!next) {
                                        try {
                                            localStorage.removeItem(CHAT_REMEMBER_UID);
                                            localStorage.removeItem(CHAT_REMEMBER_CVID);
                                        } catch { /* empty */ }
                                    } else if (selectedConsultant) {
                                        try {
                                            localStorage.setItem(CHAT_REMEMBER_UID, selectedConsultant.userId);
                                            localStorage.setItem(CHAT_REMEMBER_CVID, selectedCvId || '');
                                        } catch { /* empty */ }
                                    }
                                }}
                            />
                        </Stack>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <TextField
                                label="Top K"
                                type="number"
                                size="small"
                                value={topK}
                                onChange={(e) => setTopK(Number(e.target.value))}
                                inputProps={{ min: 1, max: 100 }}
                                sx={{ width: 100 }}
                            />
                            <Button
                                variant="contained"
                                onClick={onSubmit}
                                disabled={isSubmitting || !text.trim() || (forceMode === 'RAG' && !selectedConsultant)}
                                data-testid="send-btn"
                                sx={{minWidth: 100}}
                            >
                                {isSubmitting ? 'Sender…' : 'Send'}
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={onNewConversation}
                                disabled={isSubmitting}
                                data-testid="new-conversation-btn"
                            >
                                Ny samtale
                            </Button>
                        </Stack>
                    </Grid>
                </Grid>

                <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
                    {conversationId && (
                        <Chip size="small" label={`Samtale-ID: ${conversationId}`}/>
                    )}
                    {response?.mode && (
                        <Chip size="small" color={isRag ? 'warning' : 'default'} label={`Modus: ${response.mode}`}/>
                    )}
                    {response?.mode === 'HYBRID' && scoring && (
                        <>
                            <Chip size="small" variant="outlined" label={`w_sem=${scoring.semanticWeight ?? '?'} w_qual=${scoring.qualityWeight ?? '?'}`} />
                            {scoring.formula && (
                                <Chip size="small" variant="outlined" label={String(scoring.formula)} />
                            )}
                        </>
                    )}
                    {typeof latency === 'number' && (
                        <Chip size="small" label={`Latens: ${latency} ms`} data-testid="latency" />
                    )}
                </Stack>
            </Paper>

            {showSpinner && (
                <Box sx={{p: 4, textAlign: 'center'}}>
                    <CircularProgress/>
                    <Typography variant="body2" sx={{mt: 1}}>Laster resultater…</Typography>
                </Box>
            )}
            {error && (
                <Box sx={{p: 2}}>
                    <Alert severity="error"
                           action={<Button color="inherit" size="small" onClick={onSubmit}>Prøv igjen</Button>}>
                        {error}
                    </Alert>
                </Box>
            )}

            {response && !showSpinner && !error && (
                <>
                    {/* Debug accordion */}
                    <Accordion sx={{mb: 2}} data-testid="debug-accordion">
                        <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                            <Typography variant="subtitle1">Debug-detaljer</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack spacing={1}>
                                <Typography variant="body2">Modus: <b>{response.mode}</b></Typography>
                                {}
                                {(
                                    <Typography variant="body2">latencyMs (server): {response.latencyMs} ms</Typography>
                                )}
                                {debug?.interpretation && (
                                    <Box>
                                        <Typography variant="subtitle2" sx={{fontWeight: 'bold'}}>Tolkning</Typography>
                                        <Typography variant="body2">Route: {debug.interpretation.route}</Typography>
                                        {debug.interpretation.semanticText && (
                                            <Typography
                                                variant="body2">Semantic: {debug.interpretation.semanticText}</Typography>
                                        )}
                                        {debug.interpretation.consultantName && (
                                            <Typography
                                                variant="body2">Navn: {debug.interpretation.consultantName}</Typography>
                                        )}
                                        {debug.interpretation.question && (
                                            <Typography
                                                variant="body2">Spørsmål: {debug.interpretation.question}</Typography>
                                        )}
                                        {debug.interpretation.structured && (
                                            <Box sx={{mt: 1}}>
                                                <Typography variant="body2" sx={{fontWeight: 600}}>Strukturerte
                                                    kriterier:</Typography>
                                                <pre
                                                    style={{margin: 0}}>{JSON.stringify(debug.interpretation.structured, null, 2)}</pre>
                                            </Box>
                                        )}
                                        {debug.interpretation.confidence && (
                                            <Box sx={{mt: 1}}>
                                                <Typography variant="body2"
                                                            sx={{fontWeight: 600}}>Konfidens:</Typography>
                                                <pre
                                                    style={{margin: 0}}>{JSON.stringify(debug.interpretation.confidence, null, 2)}</pre>
                                            </Box>
                                        )}
                                    </Box>
                                )}
                                {debug?.timings && (
                                    <Box>
                                        <Typography variant="subtitle2" sx={{fontWeight: 'bold'}}>Timinger</Typography>
                                        <pre style={{margin: 0}}>{JSON.stringify(debug.timings, null, 2)}</pre>
                                    </Box>
                                )}
                                {debug?.extra && (
                                    <Box>
                                        <Typography variant="subtitle2" sx={{fontWeight: 'bold'}}>Raw</Typography>
                                        <pre style={{margin: 0}}>{JSON.stringify(debug.extra, null, 2)}</pre>
                                    </Box>
                                )}
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* Results */}
                    {isRag ? (
                        <Paper sx={{p: 2}}>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{mb: 1}}>
                                <Chip size="small" color="warning" label="Eksperimentell"/>
                                <Typography variant="subtitle1">RAG-svar</Typography>
                            </Stack>
                            <Typography variant="body1" sx={{whiteSpace: 'pre-wrap'}} data-testid="rag-answer">
                                {response.answer || 'Ingen svartekst'}
                            </Typography>

                            {response.sources && response.sources.length > 0 && (
                                <Box sx={{mt: 2}}>
                                    <Typography variant="subtitle2" sx={{mb: 1}}>Kilder</Typography>
                                    <Stack spacing={1}>
                                        {response.sources.map((s, idx) => {
                                            const userId = s.consultantId; // heuristic mapping
                                            const detailsHref = buildConsultantLink(userId);
                                            const cvHref = buildCvLink(userId);
                                            return (
                                                <Paper key={idx} sx={{p: 1.5}} data-testid={`rag-source-${idx}`}>
                                                    <Stack direction={{xs: 'column', sm: 'row'}} spacing={1}
                                                           justifyContent="space-between" alignItems={{sm: 'center'}}>
                                                        <Typography variant="body2">
                                                            <b>{s.consultantName}</b> • {s.location || 'Ukjent seksjon'} •
                                                            score {formatScoreToPercent(s.score)}
                                                        </Typography>
                                                        <Stack direction="row" spacing={1}>
                                                            {detailsHref ? (
                                                                <MuiLink href={detailsHref}>Se detaljer</MuiLink>
                                                            ) : (
                                                                <Tooltip title="Manglende ID for lenking"><span><MuiLink
                                                                    aria-disabled sx={{
                                                                    pointerEvents: 'none',
                                                                    color: 'text.disabled'
                                                                }}>Se detaljer</MuiLink></span></Tooltip>
                                                            )}
                                                            {cvHref ? (
                                                                <MuiLink href={cvHref}>Se hele CV</MuiLink>
                                                            ) : (
                                                                <Tooltip title="Manglende ID for lenking"><span><MuiLink
                                                                    aria-disabled sx={{
                                                                    pointerEvents: 'none',
                                                                    color: 'text.disabled'
                                                                }}>Se hele CV</MuiLink></span></Tooltip>
                                                            )}
                                                        </Stack>
                                                    </Stack>
                                                </Paper>
                                            );
                                        })}
                                    </Stack>
                                </Box>
                            )}
                        </Paper>
                    ) : (
                        <Paper>
                            {items.length === 0 ? (
                                <Box sx={{p: 4, textAlign: 'center'}}>
                                    <Typography variant="body1" color="text.secondary">Ingen resultater</Typography>
                                </Box>
                            ) : (
                                <Box sx={{p: 2}}>
                                    <Stack spacing={1}>
                                        {items.map((r, idx) => {
                                            const userId = resolveUserId(r);
                                            const detailsHref = buildConsultantLink(userId);
                                            const cvHref = buildCvLink(userId);
                                            return (
                                                <Paper key={idx} sx={{p: 1.5}}
                                                       data-testid={`search-result-item-${idx}`}>
                                                    <Grid container spacing={1} alignItems="center">
                                                        <Grid item xs={12} sm={4}>
                                                            <Typography variant="subtitle2">{r.name}</Typography>
                                                            <Typography variant="caption"
                                                                        color="text.secondary">Relevans: {formatScoreToPercent(r.score)}</Typography>
                                                        </Grid>
                                                        <Grid item xs={12} sm={5}>
                                                            <Stack direction="row" spacing={0.5}
                                                                   sx={{flexWrap: 'wrap'}}>
                                                                {(r.highlights || []).map((h, hIdx) => (
                                                                    <Chip key={hIdx} label={h} size="small"
                                                                          variant="outlined"/>
                                                                ))}
                                                            </Stack>
                                                        </Grid>
                                                        <Grid item xs={12} sm={3}>
                                                            <Stack direction="row" spacing={1}
                                                                   justifyContent={{xs: 'flex-start', sm: 'flex-end'}}>
                                                                {detailsHref ? (
                                                                    <MuiLink href={detailsHref}>Se detaljer</MuiLink>
                                                                ) : (
                                                                    <Tooltip
                                                                        title="Manglende ID for lenking"><span><MuiLink
                                                                        aria-disabled sx={{
                                                                        pointerEvents: 'none',
                                                                        color: 'text.disabled'
                                                                    }}>Se detaljer</MuiLink></span></Tooltip>
                                                                )}
                                                                {cvHref ? (
                                                                    <MuiLink href={cvHref}>Se hele CV</MuiLink>
                                                                ) : (
                                                                    <Tooltip
                                                                        title="Manglende ID for lenking"><span><MuiLink
                                                                        aria-disabled sx={{
                                                                        pointerEvents: 'none',
                                                                        color: 'text.disabled'
                                                                    }}>Se hele CV</MuiLink></span></Tooltip>
                                                                )}
                                                            </Stack>
                                                        </Grid>
                                                    </Grid>
                                                </Paper>
                                            );
                                        })}
                                    </Stack>
                                </Box>
                            )}
                        </Paper>
                    )}
                </>
            )}
        </Container>
    );
};

// Helpful semantic/hybrid query templates
const sampleQueries: { label: string; text: string; mode: ForceMode; topK?: number }[] = [
    { label: 'Kotlin 5+ år, Spring/PG, offentlig (10)', text: 'Gi meg 10 konsulenter som har minst 5 års erfaring med Kotlin, Spring Boot, Postgres og har jobbet i prosjekter i offentlig sektor', mode: 'HYBRID', topK: 10 },
    { label: 'SpareBank 1, Java/Spring, arkitekt', text: 'Hvilke konsulenter bør jeg sende til et prosjekt hos SpareBank 1? De må kunne Java, Spring og må ha hatt arkitekt-roller', mode: 'HYBRID', topK: 10 },
    { label: 'Fullstack React/Java', text: 'Finn erfarne fullstack-utviklere som har jobbet med React og Java i skyprosjekter de siste tre årene', mode: 'SEMANTIC', topK: 10 },
    { label: 'Data engineering', text: 'Foreslå data engineers med erfaring fra Kafka, Spark og dataplattform på GCP/Azure', mode: 'SEMANTIC', topK: 10 },
    { label: 'Kotlin backend senior', text: 'Senior Kotlin-backend med erfaring fra mikrotjenester, CI/CD og Kubernetes', mode: 'SEMANTIC', topK: 10 },
    { label: 'Python/ML', text: 'ML-konsulenter som har bygget produksjonsmodeller med Python og MLOps', mode: 'SEMANTIC', topK: 10 },
    { label: 'Arkitekt med betalingsløsninger', text: 'Arkitekter med erfaring fra betalingsløsninger, sikkerhet (OAuth2/OpenID), og høy gjennomstrømning', mode: 'HYBRID', topK: 10 },
    { label: 'Team lead/mentor', text: 'Konsulenter som kan fungere som team lead/mentor og har jobbet i tverrfaglige team', mode: 'SEMANTIC', topK: 10 },
];

export default ChatSearchTab;
