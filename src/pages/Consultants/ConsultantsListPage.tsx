import React, { useEffect, useMemo, useState } from 'react';
import { 
  Box, Container, Typography, TextField, Paper, Stack, Button, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  Avatar, Card, CardContent, Skeleton, useTheme, useMediaQuery,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { listConsultantsWithCv, runConsultantSync } from '../../services/consultantsService';
import type { ConsultantWithCvDto } from '../../types/api';
import SyncButton from '../../components/Sync/SyncButton';
import SyncNotificationPanel from '../../components/Sync/SyncNotificationPanel';
import type { SyncNotification } from '../../components/Sync/SyncNotificationPanel';
import ScoringOverlay from '../../components/ScoringOverlay';
import { getSkillsDisplay } from '../../utils/skillUtils';
import { compareByQualityThenName } from '../../utils/scoreUtils';
import CvScoreBadge from '../../components/CvScoreBadge';

// Mobile consultant card component
const ConsultantMobileCard: React.FC<{ consultant: ConsultantWithCvDto; onDetailsClick: () => void; onCvClick: () => void }> = ({ 
  consultant, onDetailsClick, onCvClick 
}) => {
  const activeCv = consultant.cvs?.find(cv => cv.active);
  const quality = activeCv?.qualityScore ?? null;
  const { displaySkills, remainingCount } = getSkillsDisplay(consultant, 3);

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar sx={{ mr: 2, width: 48, height: 48 }}>{consultant.name.charAt(0)}</Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              {consultant.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              ID: {consultant.userId}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {quality !== null ? (
              <>
<CvScoreBadge score={quality} size="md" />
                <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.secondary', textAlign: 'center' }}>
                  CV-skår
                </Typography>
              </>
            ) : (
              <Typography variant="caption" sx={{ fontSize: '0.75rem', color: 'text.secondary', textAlign: 'center' }}>
                -
              </Typography>
            )}
          </Box>
        </Box>
        
        {/* Top Skills */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>Topp ferdigheter:</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {displaySkills.map((skill, idx) => (
              <Chip key={idx} label={skill} size="small" variant="outlined" color="primary" />
            ))}
            {remainingCount > 0 && (
              <Chip label={`+${remainingCount}`} size="small" variant="outlined" />
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />
        
        {/* Actions */}
        <Stack direction="row" spacing={1}>
          <Button 
            variant="contained" 
            size="small"
            onClick={onDetailsClick}
            color="success"
            sx={{
              borderRadius: '20px', textTransform: 'none', fontWeight: 'bold',
              flex: 1
            }}
          >Se detaljer</Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={onCvClick}
            sx={{ borderRadius: '20px', textTransform: 'none', fontWeight: 'bold', flex: 1 }}
          >Se hele CV</Button>
        </Stack>
      </CardContent>
    </Card>
  );
};

// Skeleton loaders
const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <TableContainer>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell width={64}></TableCell>
          <TableCell>Navn</TableCell>
          <TableCell>Ferdigheter</TableCell>
          <TableCell align="center">Kvalitet</TableCell>
          <TableCell align="right">Handlinger</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {Array.from({ length: rows }).map((_, index) => (
          <TableRow key={index}>
            <TableCell><Skeleton variant="circular" width={40} height={40} /></TableCell>
            <TableCell><Skeleton width="80%" /></TableCell>
            <TableCell>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <Skeleton variant="rounded" width={60} height={24} />
                <Skeleton variant="rounded" width={50} height={24} />
                <Skeleton variant="rounded" width={40} height={24} />
              </Box>
            </TableCell>
            <TableCell align="center"><Skeleton variant="circular" width={36} height={36} /></TableCell>
            <TableCell align="right">
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Skeleton variant="rounded" width={80} height={32} />
                <Skeleton variant="rounded" width={80} height={32} />
              </Stack>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

const MobileSkeleton: React.FC<{ cards?: number }> = ({ cards = 5 }) => (
  <Box>
    {Array.from({ length: cards }).map((_, index) => (
      <Card key={index} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <Skeleton variant="circular" width={48} height={48} sx={{ mr: 2 }} />
            <Box sx={{ flexGrow: 1 }}>
              <Skeleton width="60%" height={24} sx={{ mb: 0.5 }} />
              <Skeleton width="40%" height={16} />
            </Box>
<Skeleton variant="circular" width={44} height={44} />
          </Box>
          <Skeleton width="100%" height={16} sx={{ mb: 1 }} />
          <Box sx={{ display: 'flex', gap: 0.5, mb: 2 }}>
            <Skeleton variant="rounded" width={60} height={24} />
            <Skeleton variant="rounded" width={50} height={24} />
            <Skeleton variant="rounded" width={40} height={24} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton variant="rounded" width="50%" height={32} />
            <Skeleton variant="rounded" width="50%" height={32} />
          </Box>
        </CardContent>
      </Card>
    ))}
  </Box>
);

const ConsultantsListPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));

  // Search UI states
  const [searchInput, setSearchInput] = useState('');
  const [nameFilter, setNameFilter] = useState('');

  // Data and UI states
  const [consultants, setConsultants] = useState<ConsultantWithCvDto[]>([]);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [syncLoading, setSyncLoading] = useState(false);
  const [showScoringOverlay, setShowScoringOverlay] = useState(false);
  const [notification, setNotification] = useState<SyncNotification | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Industries filter state
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const industryOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of consultants) {
      for (const cv of c.cvs ?? []) {
        for (const ind of cv.industries ?? []) {
          if (typeof ind === 'string' && ind.trim().length > 0) set.add(ind);
        }
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'no'));
  }, [consultants]);

  // Derived filtered list (name + industries)
  const filteredConsultants = useMemo(() => {
    const q = nameFilter.trim().toLowerCase();
    return consultants.filter(c => {
      const nameMatch = !q || c.name.toLowerCase().includes(q);
      if (!nameMatch) return false;
      if (selectedIndustries.length === 0) return true;
      const cvIndustries = (c.cvs ?? []).flatMap(cv => cv.industries ?? []);
      return selectedIndustries.some(ind => cvIndustries.includes(ind));
    });
  }, [consultants, nameFilter, selectedIndustries]);

const sortedFilteredConsultants = useMemo(() => {
    return filteredConsultants.slice().sort(compareByQualityThenName);
  }, [filteredConsultants]);

  const pagedConsultants = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedFilteredConsultants.slice(start, start + rowsPerPage);
  }, [sortedFilteredConsultants, page, rowsPerPage]);


const fetchData = async () => {
    setLoading(true);
    
    // Show loading animation if data fetching takes longer than 0.5 seconds
    const loadingTimer: NodeJS.Timeout = setTimeout(() => {}, 500);
    
    try {
      const res = await listConsultantsWithCv(true); // Only active CVs
      // Normalize defensively to ensure we always store an array
      const normalized: ConsultantWithCvDto[] = Array.isArray(res)
        ? res
        : (((res as any)?.content ?? (res as any)?.items ?? []) as ConsultantWithCvDto[]);
      // Do not sort here; sorting happens on the filtered view to ensure consistency with filters
      setConsultants(Array.isArray(normalized) ? normalized : []);
    } catch (error) {
      console.error('Failed to fetch consultants:', error);
      setNotification({
        type: 'error',
        title: 'Feil ved henting av konsulenter',
        message: 'Kunne ikke hente konsulentdata. Prøv igjen senere.'
      });
    } finally {
      clearTimeout(loadingTimer);
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // Actions
  const performSearch = () => {
    setNameFilter(searchInput);
    setPage(0);
  };

  const handleEnterKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  };

  const handleSyncAll = async () => {
    setSyncLoading(true);
    setShowScoringOverlay(true);
    
    try {
      const result = await runConsultantSync();
      setNotification({
        type: 'success',
        title: 'CV-synkronisering fullført',
        message: 'Alle CV-er er oppdatert og scoret fra Flowcase',
        details: {
          total: result.total || 0,
          succeeded: result.succeeded || 0,
          failed: result.failed || 0
        }
      });
      // Refresh data after sync
      await fetchData();
    } catch (error) {
      console.error('Sync failed:', error);
      setNotification({
        type: 'error',
        title: 'Synkronisering feilet',
        message: 'Kunne ikke oppdatere CV-er fra Flowcase. Prøv igjen senere.'
      });
    } finally {
      setSyncLoading(false);
      setShowScoringOverlay(false);
    }
  };

  const handleDismissNotification = () => {
    setNotification(null);
  };

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const gotoDetails = (userId: string) => navigate(`/consultants/${userId}`);
  const gotoCv = (userId: string) => navigate(`/cv/${userId}`);

  return (
    <Container sx={{ py: isMobile ? 2 : 4, px: isMobile ? 1 : 2 }} maxWidth="lg">
      <Box sx={{ 
        display: 'flex', 
        flexDirection: isMobile ? 'column' : 'row',
        justifyContent: 'space-between', 
        alignItems: isMobile ? 'stretch' : 'center', 
        mb: 3,
        gap: isMobile ? 2 : 0
      }}>
        <Typography variant={isMobile ? "h5" : "h4"} sx={{ textAlign: isMobile ? 'center' : 'left' }}>
          Konsulenter
        </Typography>
        <SyncButton
          variant="all"
          loading={syncLoading}
          disabled={loading}
          onClick={handleSyncAll}
        />
      </Box>

      <SyncNotificationPanel 
        notification={notification} 
        onDismiss={handleDismissNotification} 
      />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <TextField 
          label="Søk på navn" 
          value={searchInput} 
          onChange={(e) => setSearchInput(e.target.value)} 
          onKeyDown={handleEnterKey}
          size="small"
          placeholder={isMobile ? "Søk konsulent..." : "Skriv navn og trykk Enter eller Søk"}
          sx={{ flexGrow: 1 }}
          fullWidth={isMobile}
        />
        <Button 
          variant="contained" 
          color="success" 
          onClick={performSearch}
          sx={{ minWidth: isMobile ? 'auto' : 100 }}
          fullWidth={isMobile}
        >
          Søk
        </Button>
        <Typography 
          variant="body2" 
          sx={{ 
            alignSelf: isMobile ? 'flex-start' : 'center', 
            color: 'text.secondary',
            textAlign: isMobile ? 'center' : 'left',
            fontSize: isMobile ? '0.8rem' : '0.875rem'
          }}
        >
          {filteredConsultants.length} av {consultants.length} konsulenter
        </Typography>
      </Stack>

      {/* Industries filter */}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mb: 2 }} alignItems={{ xs: 'stretch', sm: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 120 }}>Industries:</Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {industryOptions.map(opt => (
            <Chip
              key={opt}
              label={opt}
              size="small"
              variant={selectedIndustries.includes(opt) ? 'filled' : 'outlined'}
              color={selectedIndustries.includes(opt) ? 'primary' : 'default'}
              onClick={() => {
                setSelectedIndustries(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt]);
                setPage(0);
              }}
            />
          ))}
          {industryOptions.length === 0 && (
            <Typography variant="caption" color="text.secondary">Ingen industries funnet</Typography>
          )}
        </Box>
      </Stack>

      {loading ? (
        <Paper>
          {isMobile ? <MobileSkeleton cards={rowsPerPage} /> : <TableSkeleton rows={rowsPerPage} />}
          {/* Keep pagination stable during loading */}
          <TablePagination
            component="div"
            rowsPerPageOptions={[5,10,20,50]}
            count={0}
            rowsPerPage={rowsPerPage}
            page={0}
            onPageChange={() => {}}
            onRowsPerPageChange={() => {}}
            sx={{ opacity: 0.5, pointerEvents: 'none' }}
          />
        </Paper>
      ) : (
        <>
          {filteredConsultants.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                {nameFilter ? 'Ingen konsulenter funnet' : 'Ingen konsulenter tilgjengelig'}
              </Typography>
              {nameFilter && (
                <Typography variant="body2" color="text.secondary">
                  Prøv å søke på et annet navn eller tøm søkefeltet.
                </Typography>
              )}
            </Paper>
          ) : (
            <Paper>
              {/* Mobile Card Layout */}
              {isMobile ? (
                <Box sx={{ p: 2 }}>
                  {pagedConsultants.map((c) => (
                    <ConsultantMobileCard
                      key={c.userId}
                      consultant={c}
                      onDetailsClick={() => gotoDetails(c.userId)}
                      onCvClick={() => gotoCv(c.userId)}
                    />
                  ))}
                </Box>
              ) : (
                /* Desktop/Tablet Table Layout */
                <TableContainer sx={{ overflowX: 'auto' }}>
                  <Table 
                    size={isTablet ? "small" : "medium"} 
                    sx={{ minWidth: isTablet ? 600 : 800 }}
                    stickyHeader
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell width={isTablet ? 48 : 64}></TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Navn</TableCell>
                        {!isTablet && <TableCell sx={{ fontWeight: 'bold' }}>Ferdigheter</TableCell>}
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Kvalitet</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Handlinger</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                    {pagedConsultants.map((c) => {
                      const activeCv = c.cvs?.find(cv => cv.active);
                      const quality = activeCv?.qualityScore ?? null;
                      const { displaySkills: topSkills, remainingCount } = getSkillsDisplay(c, 3);
                      const { displaySkills: tabletSkills, remainingCount: tabletRemaining } = getSkillsDisplay(c, 2);
                      
                      return (
                        <TableRow key={c.userId} hover sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                          <TableCell>
                            <Avatar sx={{ width: isTablet ? 32 : 40, height: isTablet ? 32 : 40 }}>
                              {c.name.charAt(0)}
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                {c.name}
                              </Typography>
                              {isTablet && (
                                <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.25 }}>
                                  {tabletSkills.map((s, idx) => (
                                    <Chip key={idx} label={s} size="small" variant="outlined" color="primary" sx={{ fontSize: '0.7rem' }} />
                                  ))}
                                  {tabletRemaining > 0 && (
                                    <Chip label={`+${tabletRemaining}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                  )}
                                </Box>
                              )}
                            </Box>
                          </TableCell>
                          {!isTablet && (
                            <TableCell>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {topSkills.map((s, idx) => (
                                  <Chip key={idx} label={s} size="small" variant="outlined" color="primary" />
                                ))}
                                {remainingCount > 0 && (
                                  <Chip label={`+${remainingCount}`} size="small" variant="outlined" />
                                )}
                              </Box>
                            </TableCell>
                          )}
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                {quality !== null ? (
                                  <>
<CvScoreBadge score={quality} size={isTablet ? 'md' : 'lg'} />
                                    <Typography 
                                      variant="caption" 
                                      sx={{ fontSize: isTablet ? '0.6rem' : '0.65rem', color: 'text.secondary', textAlign: 'center' }}
                                    >
                                      CV-skår
                                    </Typography>
                                  </>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">-</Typography>
                                )}
                              </Box>
                            </TableCell>
                            <TableCell align="right">
                              <Stack 
                                direction={isTablet ? "column" : "row"} 
                                spacing={isTablet ? 0.5 : 1} 
                                justifyContent="flex-end"
                                sx={{ minWidth: isTablet ? 80 : 'auto' }}
                              >
                                <Button 
                                  variant="contained" 
                                  size="small"
                                  onClick={() => gotoDetails(c.userId)}
                                  color="success"
                                  sx={{
                                    borderRadius: '20px', 
                                    textTransform: 'none', 
                                    fontWeight: 'bold',
                                    fontSize: isTablet ? '0.7rem' : '0.75rem',
                                    px: isTablet ? 1 : 1.5,
                                    py: isTablet ? 0.25 : 0.5
                                  }}
                                >Se detaljer</Button>
                                <Button 
                                  variant="outlined" 
                                  size="small"
                                  onClick={() => gotoCv(c.userId)}
                                  sx={{ 
                                    borderRadius: '20px', 
                                    textTransform: 'none', 
                                    fontWeight: 'bold',
                                    fontSize: isTablet ? '0.7rem' : '0.75rem',
                                    px: isTablet ? 1 : 1.5,
                                    py: isTablet ? 0.25 : 0.5
                                  }}
                                >Se hele CV</Button>
                              </Stack>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {/* Pagination */}
              <TablePagination
                component="div"
                rowsPerPageOptions={isMobile ? [5,10,20] : [5,10,20,50]}
                count={filteredConsultants.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage={isMobile ? "Per side:" : "Rader per side:"}
                labelDisplayedRows={({ from, to, count }) => 
                  isMobile ? `${from}-${to} av ${count}` : `${from}-${to} av ${count !== -1 ? count : `mer enn ${to}`}`
                }
                sx={{
                  borderTop: '1px solid',
                  borderColor: 'divider',
                  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                    fontSize: isMobile ? '0.8rem' : '0.875rem'
                  }
                }}
              />
            </Paper>
          )}
        </>
      )}
      
      {/* AI Scoring Overlay */}
      <ScoringOverlay 
        open={showScoringOverlay}
        title="Scorer alle konsulenter via AI"
        message="AI analyserer og scorer alle CV-er for kvalitet. Dette kan ta litt tid."
        estimatedTime="2-5 minutter"
      />
    </Container>
  );
};

export default ConsultantsListPage;
