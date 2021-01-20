import {RootState} from '../index';
import {pipe} from 'rxjs';

const selectAnnotation = (state: RootState) => state.annotation;
export const selectAnnotationLevels = pipe(selectAnnotation, (state) => state.levels);
