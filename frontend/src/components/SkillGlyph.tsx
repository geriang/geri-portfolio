import React from 'react';
import {
  AcademicCapIcon,
  BoltIcon,
  CloudIcon,
  CodeBracketIcon,
  CommandLineIcon,
  CpuChipIcon,
  LanguageIcon,
  LightBulbIcon,
  RectangleStackIcon,
  WrenchScrewdriverIcon,
  ServerIcon,
  GlobeAltIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import type { SkillIcon } from '../data/content';

// Map skill icons to Heroicons or custom SVGs
const ICONS: Record<SkillIcon, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  // Frontend
  bootstrap: CodeBracketIcon,
  javascript: CodeBracketIcon,
  react: CodeBracketIcon,
  vue: CodeBracketIcon,
  // Backend
  node: ServerIcon,
  express: ServerIcon,
  // Database
  mysql: RectangleStackIcon,
  mongodb: RectangleStackIcon,
  // Cloud
  azure: CloudIcon,
  gcp: CloudIcon,
  // Machine Learning
  python: CommandLineIcon,
  genai: CpuChipIcon,
  pyspark: BoltIcon,
  // Tools
  github: CommandLineIcon,
  gitlab: CommandLineIcon,
  jira: RectangleStackIcon,
  figma: WrenchScrewdriverIcon,
  balsamiq: WrenchScrewdriverIcon,
  agentic: CpuChipIcon,
  // Certifications
  cspos: AcademicCapIcon,
  'ml-course': LightBulbIcon,
  'gcp-course': AcademicCapIcon,
  // Languages
  translate: LanguageIcon,
};

export function SkillGlyph({ icon, color }: { icon: SkillIcon; color: string }) {
  const Icon = ICONS[icon] ?? CommandLineIcon;
  return <Icon className="mr-2.5 h-8 w-8 shrink-0" style={{ color }} aria-hidden="true" />;
}
