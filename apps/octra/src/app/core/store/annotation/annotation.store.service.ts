import { Injectable } from '@angular/core';
import { RootState } from '../index';
import { Store } from '@ngrx/store';

@Injectable()
export class AnnotationStoreService {
  constructor(private store: Store<RootState>) {}
}
