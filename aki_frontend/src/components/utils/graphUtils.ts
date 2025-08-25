export const COLORS = [
  "#1f77b4",
  "#ff7f0e",
  "#2ca02c",
  "#d62728",
  "#9467bd",
  "#8c564b",
  "#e377c2",
  "#7f7f7f",
  "#bcbd22",
  "#17becf",
];

const SLOT_MAP = {
  1: "0~8",
  2: "8~16",
  3: "16~24",
};

export const getDayKey = ({ day, slot }: { day: number; slot: number }) =>
  `Day: ${day}, Slot: ${slot}`;

const dayTemplate = (day: number) => `Day ${day}`;

export const getDayAxisKey = ({ day, slot }: { day: number; slot: number }) =>
  dayTemplate(day) + (slot === 1 ? "" : `: ${SLOT_MAP[slot as keyof typeof SLOT_MAP] ?? slot}`);
export const getDayTicks = (data: { day: number }[]) => data.map(({ day }) => dayTemplate(day));

export const getTicksDomain = (
  nDays: number = 7,
  nSlots: number = 3,
  formatter: ({ day, slot }: { day: number; slot: number }) => string = getDayAxisKey
): string[] => {
  const ticks = [];
  for (let day = 1; day <= nDays; day++) {
    for (let slot = 1; slot <= nSlots; slot++) {
      ticks.push(formatter({ day, slot }));
    }
  }
  return ticks;
};
