import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
    Autocomplete,
    Box,
    Button,
    Chip,
    CircularProgress,
    Container,
    Paper,
    Stack,
    TextField,
    Typography
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import {Virtuoso} from 'react-virtuoso';
import {useInfiniteQuery, useQuery} from '@tanstack/react-query';
import {
    listConsultantsBySkill,
    listSkillNames,
    listSkillSummary,
    listTopConsultantsBySkill
} from '../../services/skillsService';
import type {ConsultantSummaryDto, PageSkillSummaryDto, SkillSummaryDto} from '../../types/api';
import {useNavigate} from 'react-router-dom';

const SUMMARY_PAGE_SIZE = 25;

const SkillsOverviewPage2: React.FC = () => {
    const navigate = useNavigate();

    // Search query (debounced)
    const [filterText, setFilterText] = useState('');
    const [q, setQ] = useState('');
    const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
    const debounceRef = useRef<number | null>(null);
    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => setQ(filterText), 350);
        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [filterText]);

    // Autocomplete names
    const {data: skillOptions = []} = useQuery({
        queryKey: ['skill-names', q],
        queryFn: () => listSkillNames(q || undefined, 100),
        staleTime: 5 * 60 * 1000,
    });

    // Paginated summary (react-query)
    const summaryQuery = useInfiniteQuery({
        queryKey: ['skills-summary', q],
        queryFn: async ({pageParam = 0}) => {
            const res: PageSkillSummaryDto = await listSkillSummary({
                q: q || undefined,
                page: pageParam,
                size: SUMMARY_PAGE_SIZE,
                sort: 'consultantCount,desc'
            });
            return res;
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => {
            const page = (lastPage as any).number ?? (lastPage as any).page ?? 0;
            const totalPages = (lastPage as any).totalPages ?? 0;
            return page + 1 < totalPages ? page + 1 : undefined;
        },
    });

    const items: SkillSummaryDto[] = useMemo(() => {
        const pages = summaryQuery.data?.pages ?? [];
        return pages.flatMap((p: any) => p.content ?? []);
    }, [summaryQuery.data]);

    // Auto-expand when a unique suggestion is selected and results contain it
    useEffect(() => {
        if (!selectedSuggestion) return;
        const found = items.find(s => s.name.toUpperCase() === selectedSuggestion.toUpperCase());
        if (found) {
            toggleLoadConsultants(found.name);
        }
    }, [items, selectedSuggestion]);

    // Per-skill consultants cache (expanded)
    const [consultantsBySkill, setConsultantsBySkill] = useState<Record<string, {
        items: ConsultantSummaryDto[];
        page: number;
        last: boolean
    }>>({});
    const [top3BySkill, setTop3BySkill] = useState<Record<string, ConsultantSummaryDto[]>>({});
    const [loadingTop, setLoadingTop] = useState<Record<string, boolean>>({});

    const toggleLoadConsultants = async (skill: string) => {
        const key = skill.toUpperCase();
        const current = consultantsBySkill[key];
        if (current && current.items.length > 0) {
            // collapse
            setConsultantsBySkill(prev => ({...prev, [key]: {items: [], page: 0, last: false}}));
            return;
        }
        const res = await listConsultantsBySkill(key, {page: 0, size: 10, sort: 'name,asc'});
        setConsultantsBySkill(prev => ({
            ...prev,
            [key]: {items: res.content ?? [], page: res.number ?? 0, last: res.last ?? true}
        }));
    };

    const loadMoreConsultants = async (skill: string) => {
        const key = skill.toUpperCase();
        const current = consultantsBySkill[key];
        if (!current || current.last) return;
        const nextPage = (current.page ?? 0) + 1;
        const res = await listConsultantsBySkill(key, {page: nextPage, size: 10, sort: 'name,asc'});
        setConsultantsBySkill(prev => ({
            ...prev,
            [key]: {
                items: [...(current.items ?? []), ...(res.content ?? [])],
                page: res.number ?? nextPage,
                last: res.last ?? true,
            }
        }));
    };

    const loadTop3 = async (skill: string) => {
        const key = skill.toUpperCase();
        setLoadingTop(prev => ({...prev, [key]: true}));
        try {
            const res = await listTopConsultantsBySkill(key, 3);
            setTop3BySkill(prev => ({...prev, [key]: res}));
        } finally {
            setLoadingTop(prev => ({...prev, [key]: false}));
        }
    };

    return (
        <Container sx={{py: 4}}>
            <Typography variant="h4" gutterBottom>Ferdigheter i firma</Typography>

            <Stack direction={{xs: 'column', sm: 'row'}} spacing={2} sx={{mb: 2, alignItems: 'center'}}>
                <TextField
                    label="Søk i ferdighetsnavn (fritekst)"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    size="small"
                />
                <Autocomplete
                    options={skillOptions}
                    value={selectedSuggestion}
                    onChange={(_, v) => {
                        setSelectedSuggestion(v);
                        setFilterText(v || '');
                    }}
                    renderInput={(params) => <TextField {...params} label="Foreslåtte ferdigheter (mest populære)"
                                                        size="small" placeholder="Velg…"/>}
                    sx={{minWidth: 320}}
                />
            </Stack>

            {summaryQuery.isPending ? (
                <Box sx={{p: 2}}><CircularProgress/></Box>
            ) : (
                <Paper variant="outlined">
                    <Virtuoso
                        style={{height: '70vh'}}
                        data={items}
                        endReached={() => {
                            if (summaryQuery.hasNextPage) summaryQuery.fetchNextPage();
                        }}
                        itemContent={(_, s) => {
                            const skillKey = s.name.toUpperCase();
                            const cons = consultantsBySkill[skillKey]?.items ?? [];
                            const last = consultantsBySkill[skillKey]?.last ?? true;
                            const expanded = cons.length > 0;
                            const top3 = top3BySkill[skillKey] ?? [];
                            const isLoadingTop = !!loadingTop[skillKey];
                            return (
                                <Box sx={{p: 2, borderBottom: '1px solid', borderColor: 'divider'}}>
                                    <Stack direction="row" spacing={2} sx={{
                                        alignItems: 'baseline',
                                        flexWrap: 'wrap',
                                        justifyContent: 'space-between'
                                    }}>
                                        <Stack direction="row" spacing={2}
                                               sx={{alignItems: 'baseline', flexWrap: 'wrap'}}>
                                            <Typography variant="h6" sx={{mr: 1}}>{s.name}</Typography>
                                            <Chip size="small" label={`${s.consultantCount} konsulenter`}/>
                                            {top3.length > 0 && (
                                                <Chip size="small" color="primary" icon={<StarIcon/>}
                                                      label={`Topp ${top3.length}`}/>
                                            )}
                                        </Stack>
                                        <Stack direction="row" spacing={1}>
                                            <Button size="small" variant="outlined"
                                                    onClick={() => toggleLoadConsultants(s.name)}>
                                                {expanded ? 'Skjul konsulenter' : 'Vis konsulenter'}
                                            </Button>
                                            <Button size="small" variant="text" onClick={() => loadTop3(s.name)}
                                                    disabled={isLoadingTop}>
                                                {isLoadingTop ? 'Henter topp 3…' : 'Hent topp 3'}
                                            </Button>
                                        </Stack>
                                    </Stack>

                                    {top3.length > 0 && (
                                        <Box sx={{mt: 1}}>
                                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>Topp
                                                3</Typography>
                                            <Stack direction="row" spacing={1} sx={{flexWrap: 'wrap'}}>
                                                {top3.map(c => (
                                                    <Chip key={c.userId} label={c.name} color="primary"
                                                          icon={<StarIcon/>}
                                                          onClick={() => navigate(`/cv/${encodeURIComponent(c.userId)}`)}
                                                          clickable/>
                                                ))}
                                            </Stack>
                                        </Box>
                                    )}

                                    {expanded && (
                                        <Box sx={{mt: 1}}>
                                            <Typography variant="subtitle2" color="text.secondary"
                                                        gutterBottom>Konsulenter</Typography>
                                            <Stack direction="row" spacing={1} sx={{flexWrap: 'wrap'}}>
                                                {cons.map((c) => (
                                                    <Chip
                                                        key={c.userId}
                                                        label={c.name}
                                                        onClick={() => navigate(`/cv/${encodeURIComponent(c.userId)}`)}
                                                        clickable
                                                        variant={'outlined'}
                                                        color={'default'}
                                                    />
                                                ))}
                                                {cons.length === 0 && (
                                                    <Typography variant="body2"
                                                                color="text.secondary">Ingen</Typography>
                                                )}
                                            </Stack>
                                            {!last && (
                                                <Button size="small" sx={{mt: 1}}
                                                        onClick={() => loadMoreConsultants(s.name)}>Vis flere</Button>
                                            )}
                                        </Box>
                                    )}
                                </Box>
                            );
                        }}
                    />
                </Paper>
            )}
        </Container>
    );
};

export default SkillsOverviewPage2;
