import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Directive, inject, input, PLATFORM_ID } from '@angular/core';

const STYLE_ID = 'skeleton-directive-styles';

const CSS = `
  @keyframes sk-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }

  [data-skeleton] * {
    color: transparent !important;
    background-color: transparent !important;
    background-image: linear-gradient(
      90deg,
      #f0f1f5 0%, #f0f1f5 25%,
      #f9fafb 50%,
      #f0f1f5 75%, #f0f1f5 100%
    ) !important;
    background-size: 200% 100%;
    animation: sk-shimmer 4s ease-in-out infinite;
    border-radius: 4px !important;
    border-color: transparent !important;
    box-shadow: none !important;
    pointer-events: none;
  }

  /* Exception: elements with border-radius: 50% keep their shape */
  [data-skeleton] .avatar,
  [data-skeleton] [data-skeleton-round] {
    border-radius: 50% !important;
  }

  /* Exception: image/thumbnail areas keep their own border-radius */
  [data-skeleton] [data-skeleton-image] {
    border-radius: 0 !important;
  }
`;

/**
 * SkeletonDirective
 *
 * Applies an animated shimmer effect to all child elements
 * while skeleton() === true. The template itself stays unchanged —
 * no duplicate code for the loading and content states.
 *
 * Note: the host element itself must not be undefined/null
 * while skeleton() === true. For signals, a placeholder object
 * is recommended as the initial value:
 *   post = signal<Post>({ title: '', excerpt: '', author: '' });
 *
 * Exceptions in the template (keep their visual shape):
 *   data-skeleton-round  → keeps border-radius: 50% (for avatars etc.)
 *   data-skeleton-image  → keeps border-radius: 0  (for image containers)
 */
@Directive({
  selector: '[octraSkeleton]',
  standalone: true,
  host: {
    '[attr.data-skeleton]': 'enabled() || null',
    '[attr.style]': 'enabled() ? styleWhileEnabled() || "" : ""',
  },
})
export class SkeletonDirective {
  enabled = input.required<boolean>();
  styleWhileEnabled = input<string>();

  constructor() {
    const doc = inject(DOCUMENT);
    const platformId = inject(PLATFORM_ID);

    if (isPlatformBrowser(platformId) && !doc.getElementById(STYLE_ID)) {
      const style = doc.createElement('style');
      style.id = STYLE_ID;
      style.textContent = CSS;
      doc.head.appendChild(style);
    }
  }
}
