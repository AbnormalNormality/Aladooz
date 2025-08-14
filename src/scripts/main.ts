import { loadJson, getStorage, setStorage } from "./data.js";
import { updateSearchTerms } from "./search.js";

export type Pokemon = {
  name: string;
  title: string;
  image: string;
  types: Array<string>;
  abilities: Array<string>;
  entries: Array<string>;
  evolvesInto: Array<string> | undefined;
  evolvesFrom: Array<string> | undefined;
};

type Type = {
  name: string;
  background: string;
  foreground: string;
};

type Ability = {
  name: string;
};

type Div = HTMLDivElement;
type Img = HTMLImageElement;
type Input = HTMLInputElement;

//

function loadGallery() {
  const o = Object.keys(pokemon);

  for (const p of o) {
    const data: Pokemon = pokemon[p];
    if (!data) continue;

    const slide = document.createElement("div"),
      name = document.createElement("div"),
      image = document.createElement("img"),
      mask = document.createElement("div"),
      imageWrapper = document.createElement("div");
    slide.classList.add("slide");
    slide.dataset.id = p;

    function handleSlideEvent(event: PointerEvent) {
      if (event.button === 0) {
        if (location.hash.substring(1) !== p) location.hash = p;
        else if (html.hasAttribute("portrait")) location.hash = "";
      } else if (event.button === 2) slide.classList.toggle("highlight");
    }

    slide.addEventListener("pointerdown", handleSlideEvent);
    slide.addEventListener("contextmenu", (event) => event.preventDefault());

    name.classList.add("name");
    name.textContent = data.name;

    let i = 0;
    for (const t of data.types) {
      i++;
      const tData: Type = types[t];
      slide.style.setProperty(`--type${i}-background`, tData.background);
      slide.style.setProperty(`--type${i}-foreground`, tData.foreground);
    }

    imageWrapper.classList.add("image-wrapper");

    image.classList.add("image");
    image.src = data.image;
    image.draggable = false;
    image.loading = "lazy";

    mask.classList.add("mask");

    imageWrapper.append(image);
    mask.append(name, imageWrapper);
    slide.append(mask);
    gallery.append(slide);
    slidesMap[p] = slide;
  }

  const hashSlide: Div | undefined = slidesMap[hashP];
  if (hashSlide) hashSlide.scrollIntoView({ block: "start" });
}

function updateViewer() {
  const p = location.hash.substring(1);
  const data: Pokemon | undefined = pokemon[p];
  if (!data) {
    body.classList.add("hidden");
    return;
  }

  body.classList.remove("hidden");

  const name = document.querySelector("#viewer > .name-wrapper > .name"),
    title = document.querySelector("#viewer > .name-wrapper > .title"),
    image = document.querySelector("#viewer > .image-wrapper > .image") as Img,
    typesDiv = document.querySelector("#viewer > .types"),
    abilitiesDiv = document.querySelector("#viewer > .abilities"),
    entries = document.querySelector(
      "#viewer > .entries-panel > .entries-outer > .entries"
    );

  name.textContent = data.name;
  title.textContent = `The ${data.title} Pokémon`;
  image.src = data.image;

  entries.innerHTML = "";
  for (const e of data.entries) {
    const entry = document.createElement("div");
    entry.textContent = e;
    entries.append(entry);
  }

  abilitiesDiv.innerHTML = "";
  for (const a of data.abilities) {
    const aData = abilities[a],
      ability = document.createElement("div");
    ability.textContent = aData.name;

    ability.addEventListener("pointerdown", (event: PointerEvent) => {
      if (event.button !== 0 || searchBar.value.includes(aData.name)) return;
      searchBar.value += `, ${aData.name}`;
      searchBar.value = searchBar.value.replace(/^,|,$/g, "").trim();
      updateSearchTerms();
    });

    abilitiesDiv.append(ability);
  }

  typesDiv.innerHTML = "";
  let i = 0;
  for (const t of data.types) {
    i++;
    const tData: Type = types[t];

    viewer.style.setProperty(`--type${i}-background`, tData.background);
    viewer.style.setProperty(`--type${i}-foreground`, tData.foreground);

    const type = document.createElement("div");
    type.textContent = tData.name;

    type.addEventListener("pointerdown", (event: PointerEvent) => {
      if (event.button !== 0 || searchBar.value.includes(tData.name)) return;
      searchBar.value += `, ${tData.name}`;
      searchBar.value = searchBar.value.replace(/^,|,$/g, "").trim();
      updateSearchTerms();
    });

    typesDiv.append(type);
  }

  const evolvesInto: string[] = data.evolvesInto || [];
  const evolvesFrom: string[] = data.evolvesFrom || [];
  const hashSlide: HTMLDivElement | undefined = slidesMap[p];

  for (const el of document.querySelectorAll("#gallery > .shine"))
    el.classList.remove("shine");

  raf(() => {
    for (const e of evolvesInto.length === 0 ? [p] : evolvesInto) {
      const el = slidesMap[e];
      if (el) el.classList.add("shine");
    }

    if (hashSlide) {
      const rect = hashSlide.getBoundingClientRect();
      const fullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (!fullyVisible)
        hashSlide.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  hashP = p;
}

// function updateSearchTerms() {
//   const rawInput = searchBar.value.toLowerCase();

//   const terms = rawInput
//     .split(",")
//     .map((t) => t.trim())
//     .filter((t) => t.length > 0);

//   const url = new URL(window.location.href);
//   url.searchParams.set("q", terms.join(","));
//   history.pushState({}, "", url);

//   const slides = document.querySelectorAll<HTMLDivElement>("#gallery > .slide");

//   for (const el of slides) {
//     if (terms.length === 0) {
//       el.classList.remove("show");
//       continue;
//     }

//     const p = el.dataset.id || "";
//     const data: Pokemon = pokemon[p];

//     const matchesAll = terms.every((term) => {
//       const termLower = term.replace(/^!/, "").toLowerCase();

//       const matchId = p.toLowerCase().includes(termLower);
//       const matchName = data.name.toLowerCase().includes(termLower);

//       const matchType = data.types.some((typeId) => {
//         const typeName = types[typeId]?.name.toLowerCase() || "";
//         return typeName === termLower || typeId.toLowerCase() === termLower;
//       });

//       const matchAbility = data.abilities.some((abilityId) => {
//         const abilityName = abilities[abilityId]?.name.toLowerCase() || "";
//         return (
//           abilityName === termLower || abilityId.toLowerCase() === termLower
//         );
//       });

//       const highlighted =
//         el.classList.contains("highlight") && termLower === "highlighted";

//       const incomplete =
//         termLower === "incomplete" &&
//         (!data.title || !data.abilities.length || !data.entries.length);

//       const result =
//         matchId ||
//         matchName ||
//         matchType ||
//         matchAbility ||
//         highlighted ||
//         incomplete;

//       if (term.startsWith("!")) return !result;
//       else return result;
//     });

//     if (matchesAll) el.classList.add("show");
//     else el.classList.remove("show");
//   }

//   const showCount = document.querySelectorAll("#gallery > .slide.show").length;

//   if (showCount) document.title = `${title} (${showCount})`;
//   else document.title = title;
// }

async function DOMContentLoaded(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (document.readyState === "loading")
      document.addEventListener("DOMContentLoaded", () => resolve(), {
        once: true,
      });
    else resolve();
  });
}

function updateOrientation() {
  html.removeAttribute("portrait");

  const gallery = document.getElementById("gallery");
  const width = gallery.clientWidth,
    height = gallery.clientHeight;

  if (height > width) html.setAttribute("portrait", "");
  else html.removeAttribute("portrait");

  const hashSlide: Div | undefined = slidesMap[hashP];
  if (hashSlide)
    hashSlide.scrollIntoView({ behavior: "smooth", block: "start" });
}

function registerInput(
  input: Input,
  callback: (event: InputEvent) => void,
  store: Boolean = true,
  immediate: Boolean = true
) {
  if (store) {
    const storedValue = getStorage(`input-${input.id}`);
    if (storedValue !== null) setInput(input, storedValue);

    input.addEventListener("input", (event: InputEvent) => {
      const value = getInput(input);
      setStorage(`input-${input.id}`, value);
      callback(event);
    });
  } else {
    input.addEventListener("input", callback);
  }

  if (immediate) {
    const event = new InputEvent("input", { cancelable: true });

    Object.defineProperty(event, "target", {
      value: input,
      writable: false,
      configurable: true,
      enumerable: true,
    });

    callback(event);
  }
}

function getInput(input: Input): string | boolean {
  if (input.type === "checkbox") return input.checked;
  else return input.value;
}

function setInput(input: Input, value: string | boolean) {
  if (typeof value === "boolean") input.checked = value;
  else input.value = value;
}

function raf(callback: () => void, amount: number = 2) {
  if (amount <= 0) callback();
  else requestAnimationFrame(() => raf(callback, amount - 1));
}

function sortSlides() {
  const gallery = document.getElementById("gallery") as HTMLDivElement;

  const slides = Array.from(
    document.querySelectorAll<HTMLDivElement>("#gallery > .slide")
  );

  const order = orderInput.value;
  const reverse = reverseInput.checked;

  slides.sort(sortOrder(order, reverse));

  slides.forEach((slide) => gallery.appendChild(slide));

  raf(() => {
    const hashSlide = slidesMap[hashP];

    if (hashSlide) {
      const rect = hashSlide.getBoundingClientRect();
      const fullyVisible = rect.top >= 0 && rect.bottom <= window.innerHeight;
      if (!fullyVisible)
        hashSlide.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
}

function sortOrder(order: string, reverse = false) {
  return (a: HTMLDivElement, b: HTMLDivElement): number => {
    const idA = a.dataset.id!;
    const idB = b.dataset.id!;
    let result: number = 0;

    if (
      order === "reveal" ||
      order === "revealReverse" ||
      order === "nationalDex"
    ) {
      const indexA = orders[order].indexOf(idA);
      const indexB = orders[order].indexOf(idB);
      result =
        (indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA) -
        (indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB);
    } else if (order === "alphabetical") {
      result = idA.localeCompare(idB);
    } else if (order === "type") {
      const typesOrder = [
        "normal",
        "fire",
        "water",
        "grass",
        "electric",
        "flying",
        "ground",
        "rock",
        "fighting",
        "ice",
        "poison",
        "bug",
        "ghost",
        "psychic",
        "dragon",
        "dark",
        "fairy",
        "steel",
      ];

      const typesA = pokemon[idA].types;
      const typesB = pokemon[idB].types;

      const maxLength = Math.max(typesA.length, typesB.length);

      for (let i = 0; i < maxLength; i++) {
        const typeA = typesA[i] ?? "";
        const typeB = typesB[i] ?? "";

        const indexA = typesOrder.indexOf(typeA);
        const indexB = typesOrder.indexOf(typeB);

        const valA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
        const valB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

        if (valA !== valB) {
          result = valA - valB;
          break;
        }
      }
    }

    return reverse ? -result : result;
  };
}

//

const html = document.documentElement,
  body = document.body;
const slidesMap: Map<string, Div> = new Map();

export const pokemon: Map<string, Pokemon> = await loadJson(
    "src/data/pokemon.json"
  ),
  types: Map<string, Type> = await loadJson("src/data/types.json"),
  abilities: Map<string, Ability> = await loadJson("src/data/abilities.json"),
  orders: Map<string, Array<string>> = await loadJson("src/data/orders.json");

let hashP: string = location.hash.substring(1);
export let title: string = document.title;

window.addEventListener("resize", updateOrientation);
await DOMContentLoaded();
updateOrientation();

export const gallery = document.getElementById("gallery") as Div,
  viewer = document.getElementById("viewer") as Div,
  coolStuff = document.getElementById("cool-stuff-toggle") as Input,
  searchBar = document.getElementById("search-bar") as Input,
  orderInput = document.getElementById("order") as HTMLSelectElement,
  reverseInput = document.getElementById("reverse") as Input;

window.addEventListener("hashchange", updateViewer);
searchBar.addEventListener("input", updateSearchTerms);
orderInput.addEventListener("change", sortSlides);

registerInput(coolStuff, (event: InputEvent) => {
  if ((event.target as Input).checked) html.setAttribute("cool-stuff", "");
  else html.removeAttribute("cool-stuff");
});
registerInput(reverseInput, sortSlides);

loadGallery();
sortSlides();
updateViewer();

const params = new URLSearchParams(window.location.search);
const qValue = params.get("q");
if (qValue) searchBar.value = qValue;

updateSearchTerms();
