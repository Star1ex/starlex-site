import { forwardRef } from 'react';
import type { ComponentPropsWithoutRef, ElementType, ReactElement, ReactNode, Ref } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/cn.js';
import { SUPPORTS_REFRACTION } from './refraction.js';

export type GlassVariant = 'sidebar' | 'panel' | 'card' | 'menu' | 'modal' | 'pill' | 'dock';
export type GlassDepth = 'rest' | 'raised' | 'floating';

const glass = cva('sx-glass', {
  variants: {
    variant: {
      sidebar: 'sx-glass--sidebar',
      panel: 'sx-glass--panel',
      card: 'sx-glass--card',
      menu: 'sx-glass--menu',
      modal: 'sx-glass--modal',
      pill: 'sx-glass--pill',
      dock: 'sx-glass--dock',
    },
    depth: {
      rest: 'sx-glass--rest',
      raised: 'sx-glass--raised',
      floating: 'sx-glass--floating',
    },
    interactive: {
      true: 'sx-glass--interactive',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'card',
    interactive: false,
  },
});

type GlassOwnProps = {
  variant?: GlassVariant;
  /** Shadow tier — independent of the rim. */
  depth?: GlassDepth;
  /** Opt-in hover lift + press scale. Not every glass should react. */
  interactive?: boolean;
  /** Chromium-only edge refraction (sidebar/dock). Silently ignored elsewhere. */
  refract?: boolean;
  className?: string;
  children?: ReactNode;
};

export type GlassProps<T extends ElementType = 'div'> = GlassOwnProps & {
  /** Element/component to render as. Pass `motion.aside` etc. for framer-motion.
      Typed as `T` so the rest of the props are inferred from the element. */
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof GlassOwnProps | 'as'>;

function GlassImpl(
  { as, variant, depth, interactive, refract, className, children, ...rest }: GlassOwnProps & Record<string, unknown>,
  ref: Ref<Element>,
) {
  const Comp = (as ?? 'div') as ElementType;
  const useRefract = Boolean(refract) && SUPPORTS_REFRACTION;
  const variantProps = { variant, depth, interactive } as VariantProps<typeof glass>;

  return (
    <Comp
      ref={ref}
      className={cn(glass(variantProps), useRefract && 'sx-glass--refract', className)}
      {...rest}
    >
      {children}
    </Comp>
  );
}

/**
 * `<Glass>` — the single liquid-glass material. Layered construction
 * (body gradient → interior thickness → noise → light-catching rim →
 * optional Chromium refraction) lives in `glass.css`; this component only
 * composes the variant classes. Polymorphic + ref-forwarding so it can wrap
 * framer-motion elements.
 */
export const Glass = forwardRef(GlassImpl) as <T extends ElementType = 'div'>(
  props: GlassProps<T> & { ref?: Ref<Element> },
) => ReactElement | null;

export default Glass;
