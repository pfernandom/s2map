import { signal } from "@preact/signals-react";
import { useRef } from "react";

/**
 *
 * @typedef {Function} DebouncedFunction
 * @param {DebouncedFunction} mainFunction
 * @param {number} delay
 * @returns {DebouncedFunction}
 */
export const debounce = (mainFunction, delay, immediate = true) => {
  let timer; // Variable to store the timer ID

  return function (...args) {
    // Returns the debounced function
    clearTimeout(timer); // Clear any existing timer

    const later = () => {
      timer = null;
      if (!immediate) mainFunction.apply(this, args);
    };

    const callNow = immediate && !timer;
    clearTimeout(timer);
    timer = setTimeout(later, delay);
    if (callNow) mainFunction.apply(this, args);
  };
};

export function useSignalRef(value) {
  const ref = useRef(signal(value)).current;
  return ref;
}
