import {RootState} from '../index';
import {pipe} from 'rxjs';

export const selectAnnotation = (state: RootState) => state.annotation;
export const selectAnnotationLevels = pipe(selectAnnotation, (state) => state.levels);
export const selectAnnotationLinks = pipe(selectAnnotation, (state) => state.links);
