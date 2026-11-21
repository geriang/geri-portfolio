import React from 'react';
import {
  AcademicCapIcon,
  BoltIcon,
  ChartBarIcon,
  CheckBadgeIcon,
  CircleStackIcon,
  CloudIcon,
  CodeBracketIcon,
  CommandLineIcon,
  CpuChipIcon,
  LanguageIcon,
  LightBulbIcon,
  PencilSquareIcon,
  WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import type { SkillIcon } from '../data/content';

const ICONS: Record<SkillIcon, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  code: CodeBracketIcon,
  cpu: CpuChipIcon,
  database: CircleStackIcon,
  cloud: CloudIcon,
  bolt: BoltIcon,
  wrench: WrenchScrewdriverIcon,
  badge: CheckBadgeIcon,
  cap: AcademicCapIcon,
  chart: ChartBarIcon,
  bulb: LightBulbIcon,
  language: LanguageIcon,
  pencil: PencilSquareIcon,
};

export function SkillGlyph({ icon, color }: { icon: SkillIcon; color: string }) {
  const Icon = ICONS[icon] ?? CommandLineIcon;
  return <Icon className="mr-2.5 h-8 w-8 shrink-0" style={{ color }} aria-hidden="true" />;
}
