import type { GameEvent } from '../types';

export const RANDOM_EVENTS: GameEvent[] = [
  {
    id: 'found_wallet',
    title: 'Lost Wallet',
    text: 'I found a wallet on the sidewalk with $120 and an ID inside.',
    minAge: 8, maxAge: 99, weight: 2,
    choices: [
      { label: 'Return it', effects: { happiness: 4, money: 20 }, log: 'I returned the wallet. The owner gave me a $20 reward.', mood: 'good' },
      { label: 'Keep the cash', effects: { money: 120, happiness: -2 }, log: 'I kept $120 from a lost wallet.', mood: 'neutral', flag: 'petty_thief' },
    ],
  },
  {
    id: 'lottery_ticket',
    title: 'Scratch Ticket',
    text: 'A relative gave me a scratch-off lottery ticket.',
    minAge: 18, maxAge: 99, weight: 2,
    choices: [
      { label: 'Scratch it', effects: { money: 50, happiness: 3 }, log: 'My scratch ticket won $50!', mood: 'good' },
      { label: 'Frame it unscratched', effects: { happiness: 1 }, log: 'I framed a lottery ticket without scratching it. Schrödinger\'s winnings.', mood: 'neutral' },
    ],
  },
  {
    id: 'street_musician',
    title: 'Street Musician',
    text: 'A street musician is playing my favorite song.',
    minAge: 6, maxAge: 99, weight: 2,
    choices: [
      { label: 'Tip them', effects: { money: -5, happiness: 4 }, log: 'I tipped a street musician who played my favorite song.', mood: 'good' },
      { label: 'Stop and listen', effects: { happiness: 2 }, log: 'I listened to a street musician for a while.', mood: 'good' },
      { label: 'Keep walking', log: 'I walked past a street musician.', mood: 'neutral' },
    ],
  },
  {
    id: 'thunderstorm',
    title: 'Thunderstorm',
    text: 'A massive thunderstorm knocked the power out for the night.',
    minAge: 3, maxAge: 99, weight: 2,
    choices: [
      { label: 'Light candles and tell stories', effects: { happiness: 4 }, log: 'The power went out and we told stories by candlelight.', mood: 'good' },
      { label: 'Go to bed early', effects: { health: 1 }, log: 'The power went out, so I slept.', mood: 'neutral' },
    ],
  },
  {
    id: 'viral_video',
    title: 'Viral Video',
    text: 'Someone filmed me tripping in public and it is getting a lot of views online.',
    minAge: 12, maxAge: 60, weight: 1,
    choices: [
      { label: 'Lean into it', effects: { happiness: 3, looks: 1 }, log: 'I became a meme and embraced it.', mood: 'good' },
      { label: 'Beg them to take it down', effects: { happiness: -4 }, log: 'I became a meme and hated every second.', mood: 'bad' },
    ],
  },
  {
    id: 'inheritance_small',
    title: 'Distant Relative',
    text: 'A great-aunt I barely knew passed away and left me something in her will.',
    minAge: 10, maxAge: 99, once: true, weight: 1,
    choices: [
      { label: 'Accept gratefully', effects: { money: 500, happiness: 2 }, log: 'I inherited $500 from a great-aunt I met twice.', mood: 'good' },
    ],
  },
  {
    id: 'flat_tire_help',
    title: 'Stranded Driver',
    text: 'An elderly driver has a flat tire on the side of the road.',
    minAge: 14, maxAge: 99, weight: 2,
    choices: [
      { label: 'Help change it', effects: { happiness: 4, health: -1, money: 10 }, log: 'I helped a stranger change a tire. They insisted I take $10.', mood: 'good' },
      { label: 'Call a tow truck for them', effects: { happiness: 2 }, log: 'I called a tow truck for a stranded driver.', mood: 'neutral' },
      { label: 'Drive past', effects: { happiness: -1 }, log: 'I drove past a stranded driver.', mood: 'neutral' },
    ],
  },
  {
    id: 'book',
    title: 'Library Book',
    text: 'I found a thick old book at the library that nobody has checked out in 30 years.',
    minAge: 7, maxAge: 99, weight: 2,
    choices: [
      { label: 'Read the whole thing', effects: { smarts: 5, happiness: 1 }, log: 'I read an ancient library book cover to cover.', mood: 'good' },
      { label: 'Read the first chapter', effects: { smarts: 1 }, log: 'I read one chapter of an old book and gave up.', mood: 'neutral' },
    ],
  },
  {
    id: 'neighbor_cat',
    title: 'Neighbor\'s Cat',
    text: 'The neighbor\'s cat is stuck in a tree and yowling.',
    minAge: 6, maxAge: 70, weight: 2,
    choices: [
      { label: 'Climb up', effects: { happiness: 3, health: -3 }, log: 'I rescued a cat from a tree and got scratched for my trouble.', mood: 'neutral' },
      { label: 'Call the neighbor', effects: { happiness: 1 }, log: 'I told the neighbor their cat was in a tree.', mood: 'neutral' },
    ],
  },
  {
    id: 'garage_sale',
    title: 'Garage Sale',
    text: 'The family down the street is having a garage sale.',
    minAge: 6, maxAge: 99, weight: 2,
    condition: (s) => s.money >= 10,
    choices: [
      { label: 'Buy a mystery box for $10', effects: { money: -10, happiness: 3 }, log: 'I bought a mystery box at a garage sale. It had six spoons and a harmonica.', mood: 'neutral' },
      { label: 'Browse and leave', effects: { happiness: 1 }, log: 'I browsed a garage sale and bought nothing.', mood: 'neutral' },
    ],
  },
  {
    id: 'compliment',
    title: 'Compliment',
    text: 'A stranger stopped to tell me I have a great smile.',
    minAge: 10, maxAge: 99, weight: 2,
    condition: (s) => s.player.stats.looks >= 50,
    choices: [
      { label: 'Say thanks', effects: { happiness: 4, looks: 1 }, log: 'A stranger complimented my smile.', mood: 'good' },
      { label: 'Get suspicious', effects: { happiness: 1 }, log: 'A stranger complimented me and I assumed it was a scam.', mood: 'neutral' },
    ],
  },
  {
    id: 'midlife',
    title: 'Midlife Reflection',
    text: 'I caught my reflection in a shop window and realized I am not young anymore.',
    minAge: 40, maxAge: 50, once: true, weight: 4,
    choices: [
      { label: 'Buy something impulsive', effects: { money: -200, happiness: 5 }, log: 'I had a midlife moment and bought something expensive and shiny.', mood: 'neutral' },
      { label: 'Start a new hobby', effects: { happiness: 4, smarts: 3 }, log: 'I took up a new hobby to feel young again.', mood: 'good' },
      { label: 'Accept it', effects: { happiness: 2, smarts: 1 }, log: 'I made peace with getting older.', mood: 'good' },
    ],
  },
  {
    id: 'retirement_party',
    title: 'Slowing Down',
    text: 'People keep asking when I am going to slow down and enjoy life.',
    minAge: 62, maxAge: 70, once: true, weight: 4,
    choices: [
      { label: 'Take up gardening', effects: { happiness: 5, health: 2 }, log: 'I started a garden. The tomatoes are thriving.', mood: 'good' },
      { label: 'Travel', effects: { happiness: 7, money: -300 }, log: 'I took a trip I had been putting off for decades.', mood: 'good' },
      { label: 'Refuse to slow down', effects: { happiness: 2, health: -2 }, log: 'I refused to slow down. My knees disagree.', mood: 'neutral' },
    ],
  },
  {
    id: 'grandkids_visit',
    title: 'Young Visitors',
    text: 'The neighbor\'s grandkids came over and asked me to tell them a story about the old days.',
    minAge: 65, maxAge: 99, weight: 3,
    choices: [
      { label: 'Tell them everything', effects: { happiness: 5 }, log: 'I told the neighborhood kids stories for hours.', mood: 'good' },
      { label: 'Give them candy and shoo them off', effects: { happiness: 2, money: -5 }, log: 'I bribed the neighbor kids with candy to leave me alone.', mood: 'neutral' },
    ],
  },
];
