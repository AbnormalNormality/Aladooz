/* Sorry, this file is AI. My bad :(
My original function is still in main. */
import { types, abilities, searchBar, pokemon, title, } from "./main.js";
function tokenise(input) {
    input = input.replace(/\s+/g, " ").trim();
    const operators = ["&&", "||", "!", "&", "|", ",", "and", "or"];
    const regex = /\s*(\(|\)|!|&&|\|\||&|\||,|\bAND\b|\band\b|\bOR\b|\bor\b)/gi;
    const tokens = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(input))) {
        if (match.index > lastIndex) {
            let term = input.slice(lastIndex, match.index).trim();
            if (term)
                tokens.push({ type: "term", value: term });
        }
        const op = match[1].toLowerCase();
        if (op === "(" || op === ")") {
            tokens.push({ type: "paren", value: op });
        }
        else {
            let val = op;
            if (val === "and" || val === "&")
                val = "&&";
            if (val === "or" || val === "|")
                val = "||";
            if (val === ",")
                val = "&&";
            tokens.push({ type: "op", value: val });
        }
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < input.length) {
        const term = input.slice(lastIndex).trim();
        if (term)
            tokens.push({ type: "term", value: term });
    }
    return tokens;
}
function parseExpression(tokens) {
    let pos = 0;
    function parseOr() {
        let node = parseAnd();
        while (tokens[pos]?.type === "op" && tokens[pos].value === "||") {
            pos++;
            node = { type: "or", left: node, right: parseAnd() };
        }
        return node;
    }
    function parseAnd() {
        let node = parseNot();
        while (tokens[pos]?.type === "op" && tokens[pos].value === "&&") {
            pos++;
            node = { type: "and", left: node, right: parseNot() };
        }
        return node;
    }
    function parseNot() {
        if (tokens[pos]?.type === "op" && tokens[pos].value === "!") {
            pos++;
            return { type: "not", node: parseNot() };
        }
        return parseTerm();
    }
    function parseTerm() {
        if (pos >= tokens.length)
            return { type: "term", value: "__none__" };
        const token = tokens[pos++];
        if (token.type === "term")
            return { type: "term", value: token.value };
        if (token.type === "paren" && token.value === "(") {
            const node = parseOr();
            if (tokens[pos]?.type === "paren" && tokens[pos].value === ")")
                pos++;
            else
                throw new Error("Expected closing parenthesis");
            return node;
        }
        throw new Error(`Unexpected token: ${JSON.stringify(token)}`);
    }
    return parseOr();
}
function evaluate(node, data, el) {
    const normalize = (s) => s.toLowerCase().replace(/\s+/g, " ");
    switch (node.type) {
        case "term": {
            if (node.value === "__none__")
                return false;
            const termRaw = node.value.trim();
            const term = normalize(termRaw);
            const pId = el.dataset.id || "";
            if (term.startsWith("type:")) {
                const t = normalize(term.slice(5));
                return data.types.some((typeId) => normalize(typeId) === t ||
                    normalize(types[typeId]?.name || "") === t);
            }
            if (term.startsWith("ability:")) {
                const a = normalize(term.slice(8));
                return data.abilities.some((abilityId) => normalize(abilityId) === a ||
                    normalize(abilities[abilityId]?.name || "") === a);
            }
            if (term.startsWith("pokemon:")) {
                const n = term.slice(8);
                return (normalize(pId).includes(n) || normalize(data.name || "").includes(n));
            }
            const matchPokemon = normalize(pId).includes(term) ||
                normalize(data.name || "").includes(term);
            const matchType = data.types.some((typeId) => normalize(typeId) === term ||
                normalize(types[typeId]?.name || "") === term);
            const matchAbility = data.abilities.some((abilityId) => normalize(abilityId) === term ||
                normalize(abilities[abilityId]?.name || "") === term);
            const highlighted = el.classList.contains("highlight") && term === "highlighted";
            const incomplete = term === "incomplete" &&
                (!data.title || !data.abilities.length || !data.entries.length);
            return (matchPokemon || matchType || matchAbility || highlighted || incomplete);
        }
        case "not":
            return !evaluate(node.node, data, el);
        case "and":
            return evaluate(node.left, data, el) && evaluate(node.right, data, el);
        case "or":
            return evaluate(node.left, data, el) || evaluate(node.right, data, el);
    }
}
export function updateSearchTerms() {
    const rawInput = searchBar.value;
    const tokens = tokenise(rawInput);
    const ast = parseExpression(tokens);
    const slides = document.querySelectorAll("#gallery > .slide");
    for (const el of slides) {
        const p = el.dataset.id || "";
        const data = pokemon[p];
        if (evaluate(ast, data, el))
            el.classList.add("show");
        else
            el.classList.remove("show");
    }
    const showCount = document.querySelectorAll("#gallery > .slide.show").length;
    document.title = showCount ? `${title} (${showCount})` : title;
    const url = new URL(window.location.href);
    url.searchParams.set("q", rawInput);
    history.pushState({}, "", url);
}
