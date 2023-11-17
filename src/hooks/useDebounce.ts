import { useEffect, useState } from "react";

// https://codesandbox.io/s/react-query-debounce-ted8o?file=/src/useDebounce.js
export default function useDebounce<T>(value: T, delay: number): T {
  // Retardez l’exécution de la fonction ou de la mise à jour de l’état avec useDebounce.
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Mettre à jour la valeur avec délai après le délai spécifié
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Annuler le délai si la valeur change (également en cas de modification du délai ou de démontage)
    // C'est ainsi que nous évitons la mise à jour de la valeur avec délai si la valeur est changée...
    // ... dans la période de délai. Le délai est effacé et redémarré.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Ne réexécute l'effet que si la valeur ou le délai changent

  return debouncedValue;
}
