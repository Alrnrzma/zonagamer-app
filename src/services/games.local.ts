import AsyncStorage from "@react-native-async-storage/async-storage";

export type Game = {
  id: number;
  title: string;
  coverUri?: string;       // portada (imagen local)
  availableAt: number[];   // IDs de establecimientos donde está disponible
  createdAt: string;
};

const K = { list: "@zg_games", seq: "@zg_games_seq" };

async function nextId() {
  const raw = await AsyncStorage.getItem(K.seq);
  const n = raw ? Number(raw) : 0;
  const next = n + 1;
  await AsyncStorage.setItem(K.seq, String(next));
  return next;
}

export async function list(): Promise<Game[]> {
  const raw = await AsyncStorage.getItem(K.list);
  const arr: Game[] = raw ? JSON.parse(raw) : [];
  return arr.sort((a,b)=>b.id-a.id);
}

export async function seedIfEmpty() {
  const arr = await list();
  if (arr.length) return;
  const now = new Date().toISOString();
  const demo: Game[] = [
    { id: 1, title: "FIFA 24",   coverUri: undefined, availableAt: [1,3], createdAt: now },
    { id: 2, title: "Mortal Kombat 11", coverUri: undefined, availableAt: [2],   createdAt: now },
    { id: 3, title: "Street Fighter 6", coverUri: undefined, availableAt: [1,2,3], createdAt: now },
  ];
  await AsyncStorage.setItem(K.list, JSON.stringify(demo));
  await AsyncStorage.setItem(K.seq, "3");
}

export async function create(p: { title: string; coverUri?: string; availableAt: number[] }) {
  const arr = await list();
  const id = await nextId();
  const item: Game = { id, title: p.title.trim(), coverUri: p.coverUri, availableAt: p.availableAt, createdAt: new Date().toISOString() };
  arr.push(item);
  await AsyncStorage.setItem(K.list, JSON.stringify(arr));
  return item;
}
