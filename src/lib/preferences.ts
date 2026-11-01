import { useSyncExternalStore } from "react";

/**
 * Two visitor preferences from the Claude Design handoff, both client-only:
 *  - theme:    "light" | "dark", stored in localStorage `uktl-theme`. With no
 *              stored choice the site follows the device setting.
 *  - audience: "candidate" | "employer", stored in `uktl-for`, overridable
 *              with `?for=`. It decides which nav links, CTAs and page
 *              sections (`data-only="candidate|employer"`) are shown.
 *
 * Both are applied to <html> by PREFERENCES_SCRIPT before first paint
 * (`html.t-dark`/`html.t-light`, `html[data-for]`), so server-rendered markup
 * contains both variants and CSS hides the other one without a flash.
 */
export type Theme = "light" | "dark";
export type Audience = "candidate" | "employer";

const THEME_KEY = "uktl-theme";
const AUDIENCE_KEY = "uktl-for";
const EVENT = "uktl-preferences";

/** Inline, dependency-free; runs in <head> before the body is painted. */
export const PREFERENCES_SCRIPT = `(function(){var d=document.documentElement,g=function(k){try{return localStorage.getItem(k)}catch(e){return null}};var t=g("${THEME_KEY}");if(t==="dark"||t==="light")d.classList.add("t-"+t);var f=null;try{f=new URLSearchParams(location.search).get("for")}catch(e){}if(f!=="candidate"&&f!=="employer")f=g("${AUDIENCE_KEY}");if(f==="candidate"||f==="employer"){try{localStorage.setItem("${AUDIENCE_KEY}",f)}catch(e){}}else f="candidate";d.dataset.for=f})();`;

function put(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode: the choice lasts for this page only */
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  media.addEventListener("change", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    media.removeEventListener("change", onChange);
  };
}

/** The theme actually on screen: an explicit choice, otherwise the device setting. */
export function currentTheme(): Theme {
  const root = document.documentElement;
  if (root.classList.contains("t-dark")) return "dark";
  if (root.classList.contains("t-light")) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("t-light", "t-dark");
  root.classList.add(`t-${theme}`);
  put(THEME_KEY, theme);
  window.dispatchEvent(new Event(EVENT));
}

export function currentAudience(): Audience {
  return document.documentElement.dataset.for === "employer" ? "employer" : "candidate";
}

export function setAudience(audience: Audience) {
  document.documentElement.dataset.for = audience;
  put(AUDIENCE_KEY, audience);
  window.dispatchEvent(new Event(EVENT));
}

/** Re-renders on theme changes (toggle or device). Server render assumes light. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, currentTheme, () => "light");
}

/** Re-renders on audience changes. Server render assumes candidate. */
export function useAudience(): Audience {
  return useSyncExternalStore(subscribe, currentAudience, () => "candidate");
}

/** For code that must react to either change without React (e.g. charts reading CSS variables). */
export function onPreferencesChange(listener: () => void) {
  return subscribe(listener);
}
