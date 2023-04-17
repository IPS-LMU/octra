import { RootState } from "../index";
import { pipe } from "rxjs";

const selectASR = (state: RootState) => state.asr;
export const selectSelectedLanguage = pipe(selectASR, (state) => state.selectedLanguage);
export const selectSelectedService = pipe(selectASR, (state) => state.selectedService);

