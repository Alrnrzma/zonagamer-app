import AsyncStorage from "@react-native-async-storage/async-storage";

export type Establecimiento = {
  id: number;
  nombre: string;
  direccion?: string;         // (la que tenías)
  createdAt: string;
  photoUri?: string;
  rating?: number;
  games?: string[];
  openTime?: string;
  closeTime?: string;
  location?: { lat: number; lng: number };
  address?: string;   
};

const K = {
  list: "@zg_establecimientos",
  seq: "@zg_establecimientos_seq",
};

async function getSeq() {
  const raw = await AsyncStorage.getItem(K.seq);
  const n = raw ? Number(raw) : 0;
  const next = n + 1;
  await AsyncStorage.setItem(K.seq, String(next));
  return next;
}

export async function list(): Promise<Establecimiento[]> {
  const raw = await AsyncStorage.getItem(K.list);
  const arr: Establecimiento[] = raw ? JSON.parse(raw) : [];
  return arr.sort((a,b)=>b.id-a.id);
}

export async function seedIfEmpty() {
  const arr = await list();
  if (arr.length) return;
  const now = new Date().toISOString();
  const demo: Establecimiento[] = [
    { id: 1, nombre: "Animatrix Zamora Local 1", direccion: "Carretera 15, Km 8", createdAt: now },
    { id: 2, nombre: "Xbox Pequeña", direccion: "Av. Principal 123", createdAt: now },
    { id: 3, nombre: "ZonaTPX", direccion: "S/N Zona Norte", createdAt: now },
  ];
  await AsyncStorage.setItem(K.list, JSON.stringify(demo));
  await AsyncStorage.setItem(K.seq, "3");
}

export async function create(p: { nombre: string; direccion?: string; }) {
  const arr = await list();
  const id = await getSeq();
  const item: Establecimiento = {
    id, nombre: p.nombre.trim(), direccion: p.direccion?.trim(),
    createdAt: new Date().toISOString(),
  };
  arr.push(item);
  await AsyncStorage.setItem(K.list, JSON.stringify(arr));
  return item;
}

export async function getById(id: number) {
  const arr = await list();
  return arr.find(x=>x.id===id) ?? null;
}

export async function update(id: number, patch: Partial<Establecimiento>) {
  const arr = await list();
  const i = arr.findIndex(x=>x.id===id);
  if (i === -1) return null;
  arr[i] = { ...arr[i], ...patch };
  await AsyncStorage.setItem(K.list, JSON.stringify(arr));
  return arr[i];
}

export async function remove(id: number) {
  const arr = await list();
  const next = arr.filter(x=>x.id!==id);
  await AsyncStorage.setItem(K.list, JSON.stringify(next));
}
