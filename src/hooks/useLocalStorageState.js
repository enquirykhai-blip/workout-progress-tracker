import { useEffect, useState } from "react";
import { loadFromStorage, saveToStorage } from "../utils/storage";

export function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => loadFromStorage(key, initialValue));

  useEffect(() => {
    saveToStorage(key, value);
  }, [key, value]);

  return [value, setValue];
}
