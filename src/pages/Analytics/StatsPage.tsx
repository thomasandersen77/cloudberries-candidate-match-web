import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Stack,
  Button,
  Autocomplete,
  TextField,
  Chip,
  ToggleButtonGroup,
  ToggleButton,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  DonutSmall as DonutIcon,
  Label as LabelIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

import { getLanguageStats, getRoleStats } from '../../services/analyticsService';
import type { 
  LanguageStat, 
  RoleStat, 
  Order, 
  LanguageColumn, 
  RoleColumn,
  RoleVisualizationMode 
} from '../../types/analytics';
import { getComparator, stableSort } from '../../utils/sort';
import { formatPercent, formatNumber, formatYears } from '../../utils/format';

// Components
import SortableTableHead, { type Column } from '../../components/analytics/SortableTableHead';
import PercentageBar from '../../components/analytics/PercentageBar';
import SectionHeader from '../../components/analytics/SectionHeader';
import EmptyState from '../../components/feedback/EmptyState';
import ErrorState from '../../components/feedback/ErrorState';
import TableSkeleton from '../../components/feedback/TableSkeleton';
import RoleVisualizations from '../../components/analytics/RoleVisualizations';

const StatsPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isXs = useMediaQuery(theme.breakpoints.down('xs'));

  // Data state
  const [languages, setLanguages] = useState<LanguageStat[]>([]);
  const [roles, setRoles] = useState<RoleStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // UI state
  const [langOrder, setLangOrder] = useState<Order>('desc');
  const [langOrderBy, setLangOrderBy] = useState<LanguageColumn>('consultantCount');
  const [roleOrder, setRoleOrder] = useState<Order>('desc');
  const [roleOrderBy, setRoleOrderBy] = useState<RoleColumn>('percentage');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [roleVisualizationMode, setRoleVisualizationMode] = useState<RoleVisualizationMode>('bars');

  // Language table columns
  const languageColumns: Column<LanguageStat>[] = [
    { id: 'language', label: 'Språk', align: 'left', minWidth: 120 },
    { id: 'consultantCount', label: 'Antall konsulenter', align: 'right', minWidth: 100 },
    { id: 'percentage', label: 'Andel', align: 'right', minWidth: 100 },
    { id: 'percentage', label: 'Visualisering', align: 'left', minWidth: 140 },
    { id: 'aggregatedYears', label: 'Samlet erfaring', align: 'right', minWidth: 100, hideOnMobile: true },
  ];

  // Role table columns
  const roleColumns: Column<RoleStat>[] = [
    { id: 'role', label: 'Rolle', align: 'left', minWidth: 150 },
    { id: 'consultantCount', label: 'Antall konsulenter', align: 'right', minWidth: 100 },
    { id: 'percentage', label: 'Andel', align: 'right', minWidth: 100 },
    { id: 'percentage', label: 'Visualisering', align: 'left', minWidth: 140 },
  ];

  // Data fetching
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [langData, roleData] = await Promise.all([
        getLanguageStats(),
        getRoleStats(),
      ]);
      setLanguages(langData);
      setRoles(roleData);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e?.message ?? 'Kunne ikke hente statistikk');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Language sorting handlers
  const handleLanguageSortRequest = useCallback((property: LanguageColumn) => {
    const isAsc = langOrderBy === property && langOrder === 'asc';
    setLangOrder(isAsc ? 'desc' : 'asc');
    setLangOrderBy(property);
  }, [langOrder, langOrderBy]);

  // Role sorting handlers
  const handleRoleSortRequest = useCallback((property: RoleColumn) => {
    const isAsc = roleOrderBy === property && roleOrder === 'asc';
    setRoleOrder(isAsc ? 'desc' : 'asc');
    setRoleOrderBy(property);
  }, [roleOrder, roleOrderBy]);

  // Memoized filtered and sorted data
  const filteredAndSortedLanguages = useMemo(() => {
    let filtered = languages;
    
    if (selectedLanguages.length > 0) {
      filtered = languages.filter(lang => 
        selectedLanguages.includes(lang.language)
      );
    }
    
    return stableSort(filtered, getComparator(langOrder, langOrderBy));
  }, [languages, selectedLanguages, langOrder, langOrderBy]);

  const sortedRoles = useMemo(() => {
    return stableSort(roles, getComparator(roleOrder, roleOrderBy));
  }, [roles, roleOrder, roleOrderBy]);

  // Language options for filter
  const languageOptions = useMemo(() => {
    return languages
      .map(lang => lang.language)
      .sort((a, b) => a.localeCompare(b));
  }, [languages]);

  const totalConsultants = useMemo(() => {
    if (languages.length === 0) return 0;
    // Estimate total from the highest percentage language
    const highestPercentage = Math.max(...languages.map(l => l.percentage));
    const correspondingCount = languages.find(l => l.percentage === highestPercentage)?.consultantCount || 0;
    return Math.round(correspondingCount / (highestPercentage / 100));
  }, [languages]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <SectionHeader 
          title="Statistikk og analyse" 
          subtitle="Laster data..." 
        />
        <Stack spacing={4}>
          <TableSkeleton columns={5} rows={4} dense={isMobile} />
          <TableSkeleton columns={4} rows={3} dense={isMobile} />
        </Stack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <SectionHeader title="Statistikk og analyse" />
        <ErrorState message={error} onRetry={fetchData} />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <SectionHeader 
        title="Statistikk og analyse" 
        subtitle={`Basert på ${totalConsultants} konsulenter${lastUpdated ? ` • Oppdatert ${lastUpdated.toLocaleTimeString('nb-NO')}` : ''}`}
        action={
          <Button
            startIcon={<RefreshIcon />}
            onClick={fetchData}
            variant="outlined"
            size="small"
          >
            Oppdater
          </Button>
        }
      />

      <Stack spacing={4}>
        {/* Programming Languages Section */}
        <Box>
          <SectionHeader 
            title="Programmeringsspråk" 
            subtitle={`${filteredAndSortedLanguages.length} av ${languages.length} språk`}
          />
          
          {/* Language Filters */}
          <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <Autocomplete
              multiple
              size="small"
              sx={{ minWidth: 300, flexGrow: 1 }}
              options={languageOptions}
              value={selectedLanguages}
              onChange={(_, newValue) => setSelectedLanguages(newValue)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Filtrer språk"
                  placeholder="Velg språk..."
                />
              )}
              renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => (
                  <Chip
                    label={option}
                    size="small"
                    color="secondary"
                    {...getTagProps({ index })}
                    key={option}
                  />
                ))
              }
            />
            {selectedLanguages.length > 0 && (
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={() => setSelectedLanguages([])}
                variant="outlined"
              >
                Fjern filtre
              </Button>
            )}
          </Box>

          {/* Language Table */}
          {filteredAndSortedLanguages.length === 0 && selectedLanguages.length > 0 ? (
            <EmptyState 
              title="Ingen resultater" 
              description="Prøv å fjerne noen filtre eller velg andre språk."
            />
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size={isMobile ? 'small' : 'medium'}>
                <SortableTableHead
                  columns={languageColumns.filter(col => 
                    !col.hideOnMobile || !isXs
                  )}
                  order={langOrder}
                  orderBy={langOrderBy}
                  onRequestSort={handleLanguageSortRequest}
                  dense={isMobile}
                />
                <TableBody>
                  {filteredAndSortedLanguages.map((row) => (
                    <TableRow key={row.language}>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {row.language}
                        {isXs && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {formatYears(row.aggregatedYears)}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {formatNumber(row.consultantCount)}
                      </TableCell>
                      <TableCell align="right">
                        {formatPercent(row.percentage)}
                      </TableCell>
                      <TableCell>
                        <PercentageBar 
                          value={row.percentage} 
                          color="secondary"
                          showLabel={false}
                          small={isMobile}
                          aria-label={`${row.language}: ${formatPercent(row.percentage)} av konsulenter`}
                        />
                      </TableCell>
                      {!isXs && (
                        <TableCell align="right">
                          {formatYears(row.aggregatedYears)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>

        {/* Roles Section */}
        <Box>
          <SectionHeader 
            title="Roller" 
            subtitle={`${roles.length} ulike roller`}
            action={
              <ToggleButtonGroup
                value={roleVisualizationMode}
                exclusive
                onChange={(_, newMode) => newMode && setRoleVisualizationMode(newMode)}
                size="small"
              >
                <ToggleButton value="bars" aria-label="Søylediagram">
                  <BarChartIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="circles" aria-label="Sirkler">
                  <DonutIcon fontSize="small" />
                </ToggleButton>
                <ToggleButton value="chips" aria-label="Etiketter">
                  <LabelIcon fontSize="small" />
                </ToggleButton>
              </ToggleButtonGroup>
            }
          />

          <Grid container spacing={3}>
            {/* Role Visualizations */}
            <Grid item xs={12} md={6}>
              <Paper variant="outlined" sx={{ p: 3, minHeight: 300 }}>
                <Typography variant="h6" gutterBottom>
                  Oversikt
                </Typography>
                <RoleVisualizations roles={sortedRoles} mode={roleVisualizationMode} />
              </Paper>
            </Grid>

            {/* Role Table */}
            <Grid item xs={12} md={6}>
              <TableContainer component={Paper} variant="outlined">
                <Table size={isMobile ? 'small' : 'medium'}>
                  <SortableTableHead
                    columns={roleColumns}
                    order={roleOrder}
                    orderBy={roleOrderBy}
                    onRequestSort={handleRoleSortRequest}
                    dense={isMobile}
                  />
                  <TableBody>
                    {sortedRoles.map((row) => (
                      <TableRow key={row.role}>
                        <TableCell sx={{ fontWeight: 500 }}>
                          {row.role}
                        </TableCell>
                        <TableCell align="right">
                          {formatNumber(row.consultantCount)}
                        </TableCell>
                        <TableCell align="right">
                          {formatPercent(row.percentage)}
                        </TableCell>
                        <TableCell>
                          <PercentageBar 
                            value={row.percentage} 
                            color="primary"
                            showLabel={false}
                            small={isMobile}
                            aria-label={`${row.role}: ${formatPercent(row.percentage)} av konsulenter`}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        </Box>
      </Stack>
    </Container>
  );
};

export default StatsPage;
