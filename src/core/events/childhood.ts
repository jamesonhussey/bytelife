import type { GameEvent } from '../types';

const parent = (s: { family: { relation: string; alive: boolean; firstName: string }[] }) => {
  const alive = s.family.filter((p) => (p.relation === 'mother' || p.relation === 'father') && p.alive);
  return alive.length ? alive[0] : null;
};

export const CHILDHOOD_EVENTS: GameEvent[] = [
  {
    id: 'first_words',
    title: 'First Words',
    text: 'I said my first word today! Everyone leaned in to hear it.',
    minAge: 1, maxAge: 2, once: true, weight: 3,
    choices: [
      { label: '"Mama"', effects: { happiness: 4 }, log: 'My first word was "Mama". Mom cried.', mood: 'good' },
      { label: '"Dada"', effects: { happiness: 4 }, log: 'My first word was "Dada". Dad bragged for weeks.', mood: 'good' },
      { label: '"No!"', effects: { smarts: 2, happiness: 2 }, log: 'My first word was "No!". A sign of things to come.', mood: 'neutral' },
    ],
  },
  {
    id: 'toddler_fall',
    title: 'Tumble',
    text: 'I tried to climb the bookshelf and it did not go well.',
    minAge: 1, maxAge: 4, weight: 2,
    choices: [
      { label: 'Cry for help', effects: { health: -3, happiness: -2 }, log: 'I fell off the bookshelf and cried until someone came.', mood: 'bad' },
      { label: 'Try again', effects: { health: -6, smarts: 2 }, log: 'I fell off the bookshelf twice. I learned about gravity.', mood: 'bad' },
    ],
  },
  {
    id: 'imaginary_friend',
    title: 'Imaginary Friend',
    text: 'I have a new friend that nobody else can see. Their name is Pickles.',
    minAge: 3, maxAge: 6, once: true, weight: 2,
    choices: [
      { label: 'Play with Pickles every day', effects: { happiness: 6, smarts: 1 }, log: 'Pickles and I had many adventures.', mood: 'good' },
      { label: 'Tell everyone Pickles is real', effects: { happiness: 3, looks: -1 }, log: 'My parents got worried about Pickles.', mood: 'neutral' },
    ],
  },
  {
    id: 'birthday_gift',
    title: 'Birthday',
    text: (s) => `It's my birthday! ${parent(s)?.firstName ?? 'Someone'} gave me a wrapped present.`,
    minAge: 3, maxAge: 12, weight: 3,
    condition: (s) => parent(s) !== null,
    choices: [
      { label: 'Rip it open', effects: { happiness: 5, money: 20 }, log: 'I got a toy and a $20 bill tucked in the card.', mood: 'good' },
      { label: 'Say thank you first', effects: { happiness: 4, money: 20, smarts: 1 }, log: 'I thanked everyone before opening my gift. Grandma slipped me $20.', mood: 'good' },
    ],
  },
  {
    id: 'puppy',
    title: 'Stray Puppy',
    text: 'A stray puppy followed me home. It looks hungry.',
    minAge: 5, maxAge: 12, once: true, weight: 2,
    choices: [
      { label: 'Beg to keep it', effects: { happiness: 8 }, log: 'My parents let me keep the puppy. I named it Biscuit.', mood: 'good', flag: 'has_dog' },
      { label: 'Take it to a shelter', effects: { happiness: 2, smarts: 1 }, log: 'I took the puppy to a shelter. The right thing, but it hurt.', mood: 'neutral' },
      { label: 'Ignore it', effects: { happiness: -3 }, log: 'I left the puppy outside. I thought about it all night.', mood: 'bad' },
    ],
  },
  {
    id: 'bully',
    title: 'Playground Bully',
    text: 'A bigger kid shoved me and took my snack at the park.',
    minAge: 5, maxAge: 11, weight: 3,
    choices: [
      { label: 'Fight back', effects: { health: -5, happiness: 3, looks: -1 }, log: 'I fought the bully. I lost, but they never bothered me again.', mood: 'neutral' },
      { label: 'Tell an adult', effects: { happiness: 1, smarts: 1 }, log: 'I told an adult about the bully. They got a time-out.', mood: 'neutral' },
      { label: 'Run away', effects: { happiness: -4 }, log: 'I ran from the bully and lost my snack.', mood: 'bad' },
    ],
  },
  {
    id: 'lost_tooth',
    title: 'Lost Tooth',
    text: 'My first baby tooth fell out!',
    minAge: 5, maxAge: 7, once: true, weight: 3,
    choices: [
      { label: 'Put it under the pillow', effects: { happiness: 3, money: 5 }, log: 'The tooth fairy left me $5.', mood: 'good' },
      { label: 'Keep it in a jar', effects: { happiness: 1, smarts: 1 }, log: 'I started a tooth collection. My parents were disturbed.', mood: 'neutral' },
    ],
  },
  {
    id: 'bike',
    title: 'Learning to Ride',
    text: 'Dad took the training wheels off my bike today.',
    minAge: 5, maxAge: 9, once: true, weight: 2,
    choices: [
      { label: 'Pedal hard', effects: { happiness: 6, health: 2 }, log: 'I rode my bike without training wheels on the first try!', mood: 'good' },
      { label: 'Pedal carefully', effects: { happiness: 3, health: -2 }, log: 'I wobbled, crashed into a hedge, and tried again until I got it.', mood: 'neutral' },
    ],
  },
  {
    id: 'sleepover',
    title: 'Sleepover',
    text: 'My best friend invited me to a sleepover. There will be scary movies.',
    minAge: 7, maxAge: 13, weight: 2,
    choices: [
      { label: 'Watch the scary movie', effects: { happiness: 4, smarts: 1 }, log: 'I watched a scary movie at the sleepover and did not sleep.', mood: 'good' },
      { label: 'Hide under a blanket', effects: { happiness: 2 }, log: 'I hid under a blanket during the scary movie. Nobody noticed.', mood: 'neutral' },
      { label: 'Stay home', effects: { happiness: -2 }, log: 'I skipped the sleepover. I heard it was fun.', mood: 'bad' },
    ],
  },
  {
    id: 'allowance_chores',
    title: 'Chores',
    text: 'My parents offered me an allowance if I do chores every week.',
    minAge: 6, maxAge: 12, once: true, weight: 3,
    choices: [
      { label: 'Do the chores', effects: { money: 60, happiness: -1, smarts: 1 }, log: 'I did chores all year and earned $60.', mood: 'good' },
      { label: 'Refuse', effects: { happiness: 2 }, log: 'I refused to do chores. My room is a disaster.', mood: 'neutral' },
    ],
  },
  {
    id: 'piano',
    title: 'Music Lessons',
    text: 'Mom signed me up for piano lessons.',
    minAge: 6, maxAge: 11, once: true, weight: 2,
    choices: [
      { label: 'Practice daily', effects: { smarts: 5, happiness: -1 }, log: 'I practiced piano every day and got pretty good.', mood: 'good', flag: 'piano' },
      { label: 'Practice when forced', effects: { smarts: 2 }, log: 'I practiced piano only when forced. I can play one song.', mood: 'neutral' },
      { label: 'Quit', effects: { happiness: 3 }, log: 'I quit piano after two lessons.', mood: 'neutral' },
    ],
  },
  {
    id: 'parents_argue',
    title: 'Argument',
    text: 'I overheard my parents having a loud argument downstairs.',
    minAge: 4, maxAge: 15, weight: 2,
    condition: (s) => s.family.filter((p) => (p.relation === 'mother' || p.relation === 'father') && p.alive).length === 2,
    choices: [
      { label: 'Go downstairs and interrupt', effects: { happiness: -1 }, log: 'I interrupted my parents\' argument. They stopped, embarrassed.', mood: 'neutral' },
      { label: 'Put on headphones', effects: { happiness: -3 }, log: 'I put on headphones while my parents fought.', mood: 'bad' },
    ],
  },
  {
    id: 'summer_camp',
    title: 'Summer Camp',
    text: 'I got sent to summer camp for two weeks.',
    minAge: 8, maxAge: 13, weight: 2,
    choices: [
      { label: 'Try everything', effects: { happiness: 6, health: 3, looks: 1 }, log: 'Summer camp was amazing. I learned to canoe.', mood: 'good' },
      { label: 'Stay in the cabin', effects: { happiness: -2, smarts: 2 }, log: 'I read books in the cabin the whole time at camp.', mood: 'neutral' },
    ],
  },
  {
    id: 'video_games',
    title: 'New Console',
    text: 'My friend got a new game console. I am extremely jealous.',
    minAge: 7, maxAge: 14, weight: 2,
    choices: [
      { label: 'Save up for one', effects: { happiness: 2, smarts: 1 }, log: 'I started saving for a console of my own.', mood: 'neutral' },
      { label: 'Live at their house', effects: { happiness: 5, health: -2 }, log: 'I practically moved into my friend\'s house to play games.', mood: 'good' },
    ],
  },
  {
    id: 'science_fair',
    title: 'Science Fair',
    text: 'The school science fair is coming up.',
    minAge: 8, maxAge: 13, weight: 2,
    condition: (s) => s.education.stage === 'elementary' || s.education.stage === 'middle',
    choices: [
      { label: 'Build a volcano', effects: { smarts: 3, happiness: 3 }, log: 'My volcano erupted all over the gym floor. Second place!', mood: 'good' },
      { label: 'Build a robot', effects: { smarts: 6, happiness: 1 }, log: 'My robot barely worked, but the judges loved it.', mood: 'good' },
      { label: 'Forget about it', effects: { smarts: -2, happiness: -1 }, log: 'I forgot about the science fair and showed up empty-handed.', mood: 'bad' },
    ],
  },
];
