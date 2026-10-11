import type { GameEvent } from '../types';

export const HEALTH_EVENTS: GameEvent[] = [
  {
    id: 'chickenpox',
    title: 'Chickenpox',
    text: 'I woke up covered in itchy red spots.',
    minAge: 2, maxAge: 10, once: true, weight: 2,
    choices: [
      { label: 'Don\'t scratch', effects: { health: -3, happiness: -3 }, log: 'I got chickenpox and heroically did not scratch.', mood: 'bad' },
      { label: 'Scratch everything', effects: { health: -5, looks: -2, happiness: -1 }, log: 'I got chickenpox and scratched. I have a tiny scar now.', mood: 'bad' },
    ],
  },
  {
    id: 'flu',
    title: 'The Flu',
    text: 'I caught a nasty flu that is going around.',
    minAge: 1, maxAge: 99, weight: 1.2,
    choices: [
      { label: 'Rest and drink fluids', effects: { health: -2, happiness: -2 }, log: 'I caught the flu and stayed in bed for a week.', mood: 'bad' },
      { label: 'Push through it', effects: { health: -6, happiness: -1 }, log: 'I tried to power through the flu. It lasted three weeks.', mood: 'bad' },
    ],
  },
  {
    id: 'broken_arm',
    title: 'Broken Arm',
    text: 'I fell out of a tree and my arm is bent the wrong way.',
    minAge: 5, maxAge: 16, weight: 2,
    choices: [
      { label: 'Go to the hospital', effects: { health: -5, happiness: -2, money: -50 }, log: 'I broke my arm. Everyone signed my cast.', mood: 'bad' },
      { label: 'Walk it off', effects: { health: -12, happiness: -4 }, log: 'I broke my arm and tried to hide it. It healed crooked.', mood: 'bad' },
    ],
  },
  {
    id: 'glasses',
    title: 'Blurry Board',
    text: 'I can\'t read the board at school anymore. Everything is blurry.',
    minAge: 7, maxAge: 16, once: true, weight: 2,
    choices: [
      { label: 'Get glasses', effects: { smarts: 3, looks: -1, money: -40 }, log: 'I got glasses. The world has edges again.', mood: 'neutral', flag: 'glasses' },
      { label: 'Squint', effects: { smarts: -3 }, log: 'I refused glasses and squinted through school.', mood: 'bad' },
    ],
  },
  {
    id: 'food_poisoning',
    title: 'Bad Sushi',
    text: 'That gas station sushi was a mistake.',
    minAge: 12, maxAge: 99, weight: 2,
    choices: [
      { label: 'Suffer at home', effects: { health: -4, happiness: -3 }, log: 'I got food poisoning from gas station sushi.', mood: 'bad' },
      { label: 'Go to the hospital', effects: { health: -2, happiness: -2, money: -100 }, log: 'I got food poisoning and spent a night in the hospital.', mood: 'bad' },
    ],
  },
  {
    id: 'back_pain',
    title: 'Back Pain',
    text: 'I bent down to tie my shoe and something in my back went twang.',
    minAge: 35, maxAge: 99, weight: 3,
    choices: [
      { label: 'See a doctor', effects: { health: -1, money: -80 }, log: 'I threw out my back. The doctor said to stretch more.', mood: 'bad' },
      { label: 'Ignore it', effects: { health: -5, happiness: -2 }, log: 'I threw out my back and ignored it. Bad idea.', mood: 'bad' },
    ],
  },
  {
    id: 'checkup_scare',
    title: 'Routine Checkup',
    text: 'The doctor frowned at my test results and wants to run more tests.',
    minAge: 40, maxAge: 99, weight: 2,
    choices: [
      { label: 'Do the tests', effects: { health: 4, money: -150, happiness: -1 }, log: 'The extra tests caught something early. I\'m fine now.', mood: 'good' },
      { label: 'Decline', effects: { health: -6, happiness: 1 }, log: 'I declined extra tests. Whatever it was, it stuck around.', mood: 'bad' },
    ],
  },
  {
    id: 'allergy',
    title: 'Allergic Reaction',
    text: 'My face swelled up after eating at a new restaurant.',
    minAge: 3, maxAge: 99, weight: 1,
    choices: [
      { label: 'Emergency room', effects: { health: -3, money: -120, happiness: -2 }, log: 'I had an allergic reaction and went to the ER.', mood: 'bad' },
      { label: 'Take an antihistamine', effects: { health: -6, happiness: -2 }, log: 'I had an allergic reaction and rode it out with antihistamines.', mood: 'bad' },
    ],
  },
  {
    id: 'good_sleep',
    title: 'Great Sleep',
    text: 'I have been sleeping incredibly well lately.',
    minAge: 10, maxAge: 99, weight: 2,
    choices: [
      { label: 'Keep the routine', effects: { health: 3, happiness: 3 }, log: 'I slept like a rock for months. Life is good.', mood: 'good' },
    ],
  },
];
