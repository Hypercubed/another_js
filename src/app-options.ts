import { createContext } from '@lit-labs/context';

export interface OptionsData {
  timerEnabled: boolean;
  fpsEnabled: boolean;
}

export const defaultOptions: OptionsData = {
  timerEnabled: false,
  fpsEnabled: true,
};

export const optionsDataContextKey = 'options-data';

export const optionsDataContext = createContext<OptionsData>(
  optionsDataContextKey
);

export function optionsUpdated(detail: OptionsData) {
  return new CustomEvent(optionsDataContextKey, {
    detail,
    bubbles: true,
    composed: true,
  });
}
