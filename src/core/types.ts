export interface Stats {
  happiness: number;
  health: number;
  smarts: number;
  looks: number;
}

export type StatKey = keyof Stats;
export type Gender = 'male' | 'female';
export type Relation = 'self' | 'mother' | 'father' | 'brother' | 'sister';

export interface Genome {
  skin: number;
  hairColor: number;
  hairStyle: number;
  shirt: number;
  pants: number;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  age: number;
  alive: boolean;
  genome: Genome;
  stats: Stats;
  relation: Relation;
  relationship: number;
  deathAge?: number;
  deathCause?: string;
}

export type SchoolStage = 'none' | 'elementary' | 'middle' | 'high' | 'graduated' | 'dropout';

export interface Education {
  stage: SchoolStage;
  grade: number;
  yearsInStage: number;
}

export type Mood = 'good' | 'bad' | 'neutral';

export interface LogEntry {
  age: number;
  text: string;
  mood: Mood;
}

export interface YearActions {
  workouts: number;
  studied: boolean;
  skipped: boolean;
  checkup: boolean;
  familyTime: string[];
  shopped: number;
}

export interface Death {
  age: number;
  cause: string;
}

export interface GameState {
  version: number;
  seed: number;
  rngState: number;
  country: string;
  city: string;
  money: number;
  player: Person;
  family: Person[];
  education: Education;
  log: LogEntry[];
  flags: Record<string, number>;
  yearActions: YearActions;
  dead: boolean;
  death?: Death;
  eventsSeen: string[];
}

export interface Effects extends Partial<Stats> {
  money?: number;
}

export interface Choice {
  label: string;
  effects?: Effects;
  log: string;
  mood?: Mood;
  flag?: string;
  next?: GameEvent;
}

export interface GameEvent {
  id: string;
  title: string;
  text: string | ((s: GameState) => string);
  minAge: number;
  maxAge: number;
  weight?: number;
  once?: boolean;
  condition?: (s: GameState) => boolean;
  choices: Choice[];
}

export type BuildingKind =
  | 'home'
  | 'school'
  | 'hospital'
  | 'gym'
  | 'store'
  | 'office'
  | 'bank'
  | 'bar'
  | 'courthouse'
  | 'prison'
  | 'cemetery';
