import type { GameEvent } from '../types';

const inSchool = (s: { education: { stage: string } }) =>
  s.education.stage === 'elementary' || s.education.stage === 'middle' || s.education.stage === 'high';

export const SCHOOL_EVENTS: GameEvent[] = [
  {
    id: 'first_day',
    title: 'First Day of School',
    text: 'Today is my first day of school. My backpack is bigger than me.',
    minAge: 5, maxAge: 6, once: true, weight: 10,
    condition: inSchool,
    choices: [
      { label: 'Make a friend', effects: { happiness: 5 }, log: 'I made a friend on my first day of school.', mood: 'good' },
      { label: 'Cry for Mom', effects: { happiness: -2 }, log: 'I cried for my mom on the first day of school.', mood: 'bad' },
      { label: 'Sit quietly and observe', effects: { smarts: 2 }, log: 'I sat quietly on my first day and learned everyone\'s name.', mood: 'neutral' },
    ],
  },
  {
    id: 'pop_quiz',
    title: 'Pop Quiz',
    text: 'The teacher sprang a surprise quiz on us.',
    minAge: 7, maxAge: 17, weight: 3,
    condition: inSchool,
    choices: [
      { label: 'Do my best', effects: { smarts: 2 }, log: 'I did fine on the pop quiz.', mood: 'neutral' },
      { label: 'Copy from a neighbor', effects: { happiness: 1, smarts: -1 }, log: 'I copied answers on the pop quiz and got away with it.', mood: 'neutral', flag: 'cheater' },
    ],
  },
  {
    id: 'detention',
    title: 'Caught Talking',
    text: 'I got caught talking during class. The teacher is deciding my punishment.',
    minAge: 8, maxAge: 17, weight: 2,
    condition: inSchool,
    choices: [
      { label: 'Apologize', effects: { happiness: -1 }, log: 'I apologized for talking in class and got a warning.', mood: 'neutral' },
      { label: 'Talk back', effects: { happiness: 2, smarts: -1 }, log: 'I talked back to the teacher and got detention.', mood: 'bad' },
    ],
  },
  {
    id: 'school_play',
    title: 'School Play',
    text: 'The drama club is holding auditions for the school play.',
    minAge: 9, maxAge: 17, weight: 2,
    condition: inSchool,
    choices: [
      { label: 'Audition for the lead', effects: { happiness: 5, looks: 2 }, log: 'I got a part in the school play and only forgot one line.', mood: 'good' },
      { label: 'Work backstage', effects: { happiness: 2, smarts: 2 }, log: 'I ran the lights for the school play.', mood: 'neutral' },
      { label: 'Skip it', log: 'I didn\'t bother with the school play.', mood: 'neutral' },
    ],
  },
  {
    id: 'sports_team',
    title: 'Tryouts',
    text: 'The school soccer team is holding tryouts.',
    minAge: 10, maxAge: 17, once: true, weight: 3,
    condition: inSchool,
    choices: [
      { label: 'Try out', effects: { health: 5, happiness: 4, looks: 2 }, log: 'I made the soccer team!', mood: 'good', flag: 'athlete' },
      { label: 'Cheer from the stands', effects: { happiness: 1 }, log: 'I watched soccer tryouts from the bleachers.', mood: 'neutral' },
    ],
  },
  {
    id: 'crush',
    title: 'Crush',
    text: 'There is someone in my class I cannot stop thinking about.',
    minAge: 12, maxAge: 17, weight: 3,
    condition: inSchool,
    choices: [
      { label: 'Tell them', effects: { happiness: 4, looks: 1 }, log: 'I told my crush how I felt. They smiled. Progress.', mood: 'good' },
      { label: 'Write a note and never send it', effects: { happiness: -1, smarts: 1 }, log: 'I wrote my crush a note and hid it in a drawer.', mood: 'neutral' },
    ],
  },
  {
    id: 'cheating_offer',
    title: 'Test Answers',
    text: 'A classmate is selling answers to tomorrow\'s big exam for $20.',
    minAge: 13, maxAge: 17, weight: 2,
    condition: (s) => inSchool(s) && s.money >= 20,
    choices: [
      { label: 'Buy them', effects: { money: -20, smarts: -2, happiness: 2 }, log: 'I bought exam answers. They were half wrong.', mood: 'neutral', flag: 'cheater' },
      { label: 'Study instead', effects: { smarts: 4, happiness: -1 }, log: 'I turned down the stolen answers and studied all night.', mood: 'good' },
      { label: 'Report them', effects: { smarts: 1, happiness: -2 }, log: 'I reported the classmate selling answers. Nobody sits with me now.', mood: 'neutral' },
    ],
  },
  {
    id: 'party_invite',
    title: 'House Party',
    text: 'I got invited to a house party. The parents are out of town.',
    minAge: 14, maxAge: 17, weight: 3,
    choices: [
      { label: 'Go and stay sober', effects: { happiness: 4, looks: 1 }, log: 'I went to the party and had a good time.', mood: 'good' },
      { label: 'Go and drink', effects: { happiness: 6, health: -4, smarts: -1 }, log: 'I drank at the party and regretted it in the morning.', mood: 'neutral', flag: 'drank' },
      { label: 'Stay home', effects: { happiness: -2, smarts: 1 }, log: 'I skipped the party and did homework.', mood: 'neutral' },
    ],
  },
  {
    id: 'drivers_test',
    title: "Driver's Test",
    text: 'I am old enough to take my driving test.',
    minAge: 16, maxAge: 18, once: true, weight: 6,
    choices: [
      { label: 'Take it', effects: { happiness: 6 }, log: 'I passed my driving test on the first try!', mood: 'good', flag: 'license' },
      { label: 'Wait another year', log: 'I decided to wait on my driver\'s license.', mood: 'neutral' },
    ],
  },
  {
    id: 'prom',
    title: 'Prom',
    text: 'Prom is this weekend.',
    minAge: 17, maxAge: 18, once: true, weight: 8,
    condition: (s) => s.education.stage === 'high',
    choices: [
      { label: 'Go with a date', effects: { happiness: 8, looks: 2, money: -80 }, log: 'I went to prom with a date and danced badly.', mood: 'good' },
      { label: 'Go with friends', effects: { happiness: 6, money: -50 }, log: 'I went to prom with a group of friends.', mood: 'good' },
      { label: 'Skip prom', effects: { happiness: -3 }, log: 'I skipped prom and watched movies alone.', mood: 'bad' },
    ],
  },
];
