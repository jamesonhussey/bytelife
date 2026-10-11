export interface Country {
  name: string;
  cities: string[];
}

export const COUNTRIES: Country[] = [
  { name: 'United States', cities: ['Springfield', 'Riverside', 'Fairview', 'Oakdale'] },
  { name: 'United Kingdom', cities: ['Ashford', 'Bexley', 'Harrow', 'Kendal'] },
  { name: 'Canada', cities: ['Maple Ridge', 'Kelowna', 'Barrie', 'Red Deer'] },
  { name: 'Australia', cities: ['Wollongong', 'Geelong', 'Cairns', 'Ballarat'] },
  { name: 'Germany', cities: ['Lindau', 'Celle', 'Fulda', 'Bamberg'] },
  { name: 'Japan', cities: ['Matsue', 'Beppu', 'Hakodate', 'Nara'] },
  { name: 'Brazil', cities: ['Ouro Preto', 'Petropolis', 'Gramado', 'Olinda'] },
  { name: 'France', cities: ['Annecy', 'Colmar', 'Bayonne', 'Dinan'] },
  { name: 'Italy', cities: ['Lucca', 'Matera', 'Trento', 'Siena'] },
  { name: 'Mexico', cities: ['Puebla', 'Oaxaca', 'Merida', 'Queretaro'] },
];
