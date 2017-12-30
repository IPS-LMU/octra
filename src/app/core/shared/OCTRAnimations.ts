import {animate, state, style, transition, trigger} from '@angular/animations';

export const OCTRANIMATIONS = [
  trigger('fadeToggle', [
    state('inactive', style({
      display: 'none',
      opacity: '0.0'
    })),
    state('active', style({
      opacity: '1.0'
    })),
    state('close', style({
      display: 'none',
      opacity: '0.0'
    })),
    transition('inactive => active', animate('300ms ease-in')),
    transition('active => inactive', animate('300ms ease-in'))
  ])
];

export const toggleFade = (element: HTMLElement) => {
  if (!element.hasAttribute('state') || element.getAttribute('state') === 'inactive') {
    element.setAttribute('state', 'active');
  } else {
    element.setAttribute('state', 'inactive');
  }
};
