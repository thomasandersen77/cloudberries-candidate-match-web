import React from 'react';
import {
  Box,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Stack,
} from '@mui/material';

// TypeScript interfaces for CV data structure
interface CvSkill {
  name?: string;
}

interface CvSkillCategory {
  name?: string;
  skills?: CvSkill[];
}

interface CvQualification {
  description?: string;
  text?: string;
  title?: string;
}

interface CvEducation {
  institution?: string;
  school?: string;
  university?: string;
  degree?: string;
  title?: string;
  start?: string;
  startYear?: string;
  from?: string;
  end?: string;
  endYear?: string;
  to?: string;
  period?: {
    start?: string;
    end?: string;
  };
}

interface CvWorkExperience {
  employer?: string;
  company?: string;
  client?: string;
  role?: string;
  position?: string;
  title?: string;
  start?: string;
  startDate?: string;
  from?: string;
  end?: string;
  endDate?: string;
  to?: string;
  period?: {
    start?: string;
    end?: string;
  };
  description?: string;
  summary?: string;
}

interface CvProject {
  projectName?: string;
  title?: string;
  name?: string;
  customer?: string;
  client?: string;
  role?: string;
  roles?: Array<{ name?: string }>;
  skills?: Array<{ name?: string }>;
  technologies?: Array<{ name?: string }>;
  start?: string;
  startDate?: string;
  from?: string;
  end?: string;
  endDate?: string;
  to?: string;
}

interface CvCertification {
  name?: string;
  title?: string;
  issuer?: string;
  organization?: string;
  year?: string;
  date?: string;
}

// Flexible CV data structure to handle various formats
interface CvData {
  keyQualifications?: CvQualification[];
  cvKeyQualifications?: CvQualification[];
  qualifications?: CvQualification[];
  key_qualifications?: CvQualification[];
  education?: CvEducation[];
  cvEducation?: CvEducation[];
  educations?: CvEducation[];
  workExperiences?: CvWorkExperience[];
  workExperience?: CvWorkExperience[];
  cvWorkExperiences?: CvWorkExperience[];
  cvWorkExperience?: CvWorkExperience[];
  experience?: CvWorkExperience[];
  experiences?: CvWorkExperience[];
  projectExperiences?: CvProject[];
  projectExperience?: CvProject[];
  cvProjectExperiences?: CvProject[];
  cvProjectExperience?: CvProject[];
  projects?: CvProject[];
  certifications?: CvCertification[];
  cvCertifications?: CvCertification[];
  certs?: CvCertification[];
  skillCategories?: CvSkillCategory[];
  skillsByCategory?: CvSkillCategory[];
  cvSkillCategories?: CvSkillCategory[];
  [key: string]: unknown; // Allow for additional unknown properties
}

// Best-effort CV renderer into sectioned tables.
// Tries to detect common sections from Flowcase CV JSON, but tolerates arbitrary shapes.
export interface CvSectionsTableProps {
  cv: CvData | null | undefined;
}

const sectionTitleSx = { mt: 3, mb: 1 } as const;

export default function CvSectionsTable({ cv }: CvSectionsTableProps) {
  if (!cv) return <Typography>Ingen CV-data.</Typography>;

  const keyQualifications = pickArray(cv, ['keyQualifications', 'cvKeyQualifications', 'qualifications', 'key_qualifications']) as CvQualification[] | null;
  const education = pickArray(cv, ['education', 'cvEducation', 'educations']) as CvEducation[] | null;
  const work = pickArray(cv, ['workExperiences', 'workExperience', 'cvWorkExperiences', 'cvWorkExperience', 'experience', 'experiences']) as CvWorkExperience[] | null;
  const projects = pickArray(cv, ['projectExperiences', 'projectExperience', 'cvProjectExperiences', 'cvProjectExperience', 'projects']) as CvProject[] | null;
  const certifications = pickArray(cv, ['certifications', 'cvCertifications', 'certs']) as CvCertification[] | null;
  const skillCategories = pickArray(cv, ['skillCategories', 'skillsByCategory', 'cvSkillCategories']) as CvSkillCategory[] | null;

  return (
    <Box>
      {/* Key Qualifications */}
      {Array.isArray(keyQualifications) && keyQualifications.length > 0 && (
        <SectionPaper>
          <Typography variant="h6" sx={sectionTitleSx}>Nøkkelkvalifikasjoner</Typography>
          <TableSimple
            headers={[ 'Tekst' ]}
            rows={keyQualifications.map((q) => [stringy(q?.description ?? q?.text ?? q?.title ?? q)])}
          />
        </SectionPaper>
      )}

      {/* Skills */}
      {Array.isArray(skillCategories) && skillCategories.length > 0 && (
        <SectionPaper>
          <Typography variant="h6" sx={sectionTitleSx}>Kompetanse</Typography>
          {skillCategories.map((cat, idx: number) => (
            <Box key={idx} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>{stringy(cat?.name ?? 'Kompetanse')}</Typography>
              <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                {Array.isArray(cat?.skills)
                  ? cat.skills.map((s, i: number) => (
                      <Chip key={i} label={stringy(s?.name ?? s)} variant="outlined" size="small" />
                    ))
                  : null}
              </Stack>
            </Box>
          ))}
        </SectionPaper>
      )}

      {/* Education */}
      {Array.isArray(education) && education.length > 0 && (
        <SectionPaper>
          <Typography variant="h6" sx={sectionTitleSx}>Utdanning</Typography>
          <TableSimple
            headers={[ 'Institusjon', 'Grad', 'Fra', 'Til' ]}
            rows={education.map((e) => [
              stringy(e?.institution ?? e?.school ?? e?.university),
              stringy(e?.degree ?? e?.title),
              fmtPeriodPart(e?.start ?? e?.startYear ?? e?.from ?? e?.period?.start),
              fmtPeriodPart(e?.end ?? e?.endYear ?? e?.to ?? e?.period?.end),
            ])}
          />
        </SectionPaper>
      )}

      {/* Work Experience */}
      {Array.isArray(work) && work.length > 0 && (
        <SectionPaper>
          <Typography variant="h6" sx={sectionTitleSx}>Arbeidserfaring</Typography>
          <TableSimple
            headers={[ 'Arbeidsgiver', 'Rolle', 'Fra', 'Til', 'Beskrivelse' ]}
            rows={work.map((w) => [
              stringy(w?.employer ?? w?.company ?? w?.client),
              stringy(w?.role ?? w?.position ?? w?.title),
              fmtPeriodPart(w?.start ?? w?.startDate ?? w?.from ?? w?.period?.start),
              fmtPeriodPart(w?.end ?? w?.endDate ?? w?.to ?? w?.period?.end),
              stringy(w?.description ?? takeFirstLine(w?.summary)),
            ])}
          />
        </SectionPaper>
      )}

      {/* Projects */}
      {Array.isArray(projects) && projects.length > 0 && (
        <SectionPaper>
          <Typography variant="h6" sx={sectionTitleSx}>Prosjekter</Typography>
          <TableSimple
            headers={[ 'Prosjekt', 'Kunde', 'Rolle', 'Teknologi', 'Periode' ]}
            rows={projects.map((p) => [
              stringy(p?.projectName ?? p?.title ?? p?.name),
              stringy(p?.customer ?? p?.client),
              stringy(arrJoin(p?.roles, 'name') ?? p?.role),
              stringy(arrJoin(p?.skills, 'name') ?? arrJoin(p?.technologies, 'name')),
              period(p?.start ?? p?.startDate ?? p?.from, p?.end ?? p?.endDate ?? p?.to),
            ])}
          />
        </SectionPaper>
      )}

      {/* Certifications */}
      {Array.isArray(certifications) && certifications.length > 0 && (
        <SectionPaper>
          <Typography variant="h6" sx={sectionTitleSx}>Sertifiseringer</Typography>
          <TableSimple
            headers={[ 'Navn', 'Utsteder', 'År/Dato' ]}
            rows={certifications.map((c) => [
              stringy(c?.name ?? c?.title),
              stringy(c?.issuer ?? c?.organization),
              stringy(c?.year ?? c?.date),
            ])}
          />
        </SectionPaper>
      )}

      {/* Fallback generic table if nothing recognized */}
      {!(keyQualifications?.length || education?.length || work?.length || projects?.length || certifications?.length || skillCategories?.length) && (
        <SectionPaper>
          <Typography variant="h6" sx={sectionTitleSx}>CV (generisk visning)</Typography>
          <pre style={{ margin: 0 }}>{JSON.stringify(cv, null, 2)}</pre>
        </SectionPaper>
      )}
    </Box>
  );
}

function SectionPaper({ children }: { children: React.ReactNode }) {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {children}
      <Divider sx={{ mt: 2 }} />
    </Paper>
  );
}

function TableSimple({ headers, rows }: { headers: string[]; rows: (string | React.ReactNode)[][] }) {
  return (
    <TableContainer>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            {headers.map((h, i) => (
              <TableCell key={i}>{h}</TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={i}>
              {r.map((c, j) => (
                <TableCell key={j}>{c}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function pickArray(obj: CvData, keys: string[]): unknown[] | null {
  for (const k of keys) {
    const found = obj?.[k];
    if (Array.isArray(found)) return found;
  }
  return null;
}

function stringy(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(stringy).filter(Boolean).join(', ');
  if (typeof v === 'object' && v !== null) {
    return 'toString' in v && typeof v.toString === 'function' ? v.toString() : JSON.stringify(v);
  }
  return String(v);
}

function arrJoin(arr: unknown, key?: string): string | null {
  if (!Array.isArray(arr)) return null;
  if (key) {
    return arr.map((x) => {
      if (x && typeof x === 'object' && key in x) {
        return stringy((x as Record<string, unknown>)[key] ?? x);
      }
      return stringy(x);
    }).filter(Boolean).join(', ');
  }
  return arr.map(stringy).filter(Boolean).join(', ');
}

function fmtPeriodPart(val: unknown): string {
  if (!val) return '';
  const s = String(val);
  // Trim timestamps to date or year
  return s.length > 10 ? s.slice(0, 10) : s;
}

function period(from: unknown, to: unknown): string {
  const a = fmtPeriodPart(from);
  const b = fmtPeriodPart(to) || 'nå';
  return [a, b].filter(Boolean).join(' - ');
}

function takeFirstLine(v: unknown): string {
  const s = stringy(v);
  return s.split(/\n/)[0] ?? s;
}
