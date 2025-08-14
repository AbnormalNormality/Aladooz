export async function loadJson(path) {
    const response = await fetch(path);
    return (await response.json());
}
export function getStorage(key) {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    return value;
}
export function setStorage(key, value) {
    value = JSON.stringify(value);
    localStorage.setItem(key, value);
}
