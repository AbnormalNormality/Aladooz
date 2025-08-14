export async function loadJson<T = any>(path: string): Promise<T> {
  const response = await fetch(path);
  return (await response.json()) as T;
}

export function getStorage(key: string): string | boolean | null {
  const value = JSON.parse(localStorage.getItem(key) || "null");
  return value;
}

export function setStorage(key: string, value: any) {
  value = JSON.stringify(value);
  localStorage.setItem(key, value);
}
