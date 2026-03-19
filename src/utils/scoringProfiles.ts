import type { ScoringProfile } from '../types';

// ============================================================
// Scoring Profiles
// Classic: mirrors the existing franchise scoring weights
// PT27 Meta: optimized for OOTP 27 Perfect Team simulation engine
// ============================================================

export const CLASSIC_PROFILE: ScoringProfile = {
  id: 'classic',
  label: 'Classic (Franchise)',
  description: 'Balanced weights matching the franchise scoring engine. Equal value for Contact, Power, and Eye.',
  offensiveWeights: { con: 0.20, pow: 0.20, eye: 0.20, gap: 0.15, spe: 0.10, ste: 0.05, babip: 0.10 },
  defensiveWeights: {
    catcher: { cAbi: 0.50, cArm: 0.50 },
    infield: { ifRng: 0.35, ifErr: 0.25, ifArm: 0.25, tdp: 0.15 },
    outfield: { ofRng: 0.40, ofErr: 0.30, ofArm: 0.30 },
  },
  pitchingWeights:  { stu: 0.30, mov: 0.25, con: 0.20, hra: 0.10, pbabip: 0.10, hld: 0.05 },
  relieverWeights:  { stu: 0.35, mov: 0.20, con: 0.15, hld: 0.15, hra: 0.10, pbabip: 0.05 },
  positionDefenseImportance: { C: 0.70, SS: 0.65, CF: 0.60, '2B': 0.50, '3B': 0.45, RF: 0.40, LF: 0.30, '1B': 0.20, DH: 0 },
};

export const PT27_META_PROFILE: ScoringProfile = {
  id: 'pt27_meta',
  label: 'PT27 Meta',
  description:
    'OOTP 27 Perfect Team meta weights. Eye & Contact dominate batting (53% combined vs 12% Power). ' +
    'Stuff is king for relievers (45%). Starters lean on Stuff+Movement (70%). ' +
    'Defense prioritizes Catcher Ability and Range up the middle (SS, 2B, CF).',
  offensiveWeights: { con: 0.25, pow: 0.12, eye: 0.28, gap: 0.12, spe: 0.10, ste: 0.05, babip: 0.08 },
  defensiveWeights: {
    catcher: { cAbi: 0.65, cArm: 0.35 },
    infield: { ifRng: 0.50, ifErr: 0.20, ifArm: 0.20, tdp: 0.10 },
    outfield: { ofRng: 0.50, ofErr: 0.25, ofArm: 0.25 },
  },
  pitchingWeights:  { stu: 0.35, mov: 0.35, con: 0.08, hra: 0.10, pbabip: 0.07, hld: 0.05 },
  relieverWeights:  { stu: 0.45, mov: 0.20, con: 0.05, hld: 0.15, hra: 0.10, pbabip: 0.05 },
  positionDefenseImportance: { C: 0.80, SS: 0.75, CF: 0.70, '2B': 0.55, '3B': 0.45, RF: 0.40, LF: 0.30, '1B': 0.20, DH: 0 },
};

export const SCORING_PROFILES: Record<string, ScoringProfile> = {
  classic: CLASSIC_PROFILE,
  pt27_meta: PT27_META_PROFILE,
};
