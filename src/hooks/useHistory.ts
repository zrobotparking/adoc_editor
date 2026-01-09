import { useState, useCallback, useRef, useEffect } from 'react';

interface UseHistoryResult<T> {
  state: T;
  set: (newState: T | ((prev: T) => T), shouldCommit?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useHistory<T>(initialState: T, debounceTime: number = 2000): UseHistoryResult<T> {
  const [history, setHistory] = useState<{
    past: T[];
    present: T;
    future: T[];
  }>({
    past: [],
    present: initialState,
    future: []
  });

  const [internalState, setInternalState] = useState<T>(initialState);
  const stateRef = useRef(initialState);
  const timeoutRef = useRef<number | null>(null);
  
  // Sync ref with state
  useEffect(() => {
      stateRef.current = internalState;
  }, [internalState]);

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;

  const undo = useCallback(() => {
    if (!canUndo) return;

    // Clear any pending debounced save
    if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }

    setHistory(curr => {
        const previous = curr.past[curr.past.length - 1];
        const newPast = curr.past.slice(0, curr.past.length - 1);
        
        setInternalState(previous); // Sync UI immediately
        
        return {
            past: newPast,
            present: previous,
            future: [curr.present, ...curr.future]
        };
    });
  }, [canUndo]);

  const redo = useCallback(() => {
    if (!canRedo) return;

    if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }

    setHistory(curr => {
        const next = curr.future[0];
        const newFuture = curr.future.slice(1);
        
        setInternalState(next); // Sync UI immediately

        return {
            past: [...curr.past, curr.present],
            present: next,
            future: newFuture
        };
    });
  }, [canRedo]);

  const set = useCallback((newStateOrFn: T | ((prev: T) => T), shouldCommit: boolean = false) => {
    // Resolve new state using ref (stable)
    const newState = typeof newStateOrFn === 'function' 
        ? (newStateOrFn as (prev: T) => T)(stateRef.current) 
        : newStateOrFn;

    // Update UI immediately (controlled component needs this)
    setInternalState(newState);

    // If explicit commit requested, force update
    if (shouldCommit) {
         if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
         }

         setHistory(curr => {
             // If state hasn't effectively changed, don't push
             if (curr.present === newState) return curr;
 
             return {
                 past: [...curr.past, curr.present],
                 present: newState,
                 future: []
             };
         });
         return;
    }

    // Otherwise, use debounce as fallback
    if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
        setHistory(curr => {
            if (curr.present === newState) return curr;

            return {
                past: [...curr.past, curr.present],
                present: newState,
                future: []
            };
        });
    }, debounceTime);
  }, [debounceTime]);


  return {
    state: internalState,
    set,
    undo,
    redo,
    canUndo,
    canRedo
  };
}
