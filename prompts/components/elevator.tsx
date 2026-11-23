// AS SHARED, AND IT CANNOT BUILD: it imports ./elevator-utils/mount and ./elevator-utils/elevator-engine, which were
// not in the paste. It is the React wrapper cut out of the npm package @lucasmarkes/hairline (MIT). Don't use this
// file: install the package and import { Elevator } from "@lucasmarkes/hairline/react". See prompts/elevator.md.
"use client";

import {
  forwardRef, useCallback, useEffect, useLayoutEffect, useRef,
  type ComponentPropsWithoutRef, type ForwardRefExoticComponent, type RefAttributes,
} from "react";
import { create, type Figure, type HairlineOptions } from "./elevator-utils/mount";
import { mount as elevatorEngine } from "./elevator-utils/elevator-engine";

/**
 * @lucasmarkes/hairline — Elevator, scoped out of the twenty-seven figure
 * package to stand alone. The wrapper below is `react.tsx`'s `make()` and
 * `index.ts`'s `elevator()` factory, combined for this one figure: a
 * component renders one empty `<div>` and mounts the figure on it in a
 * layout effect, so on the server the box is there and the drawing is not.
 * It mounts once: a changed option reaches the running figure as `update`,
 * and `onRead` is called through a ref, so an inline function never remounts.
 *
 * Four floors beside an open shaft. The pointer's height picks a floor, and
 * the car travels there through the ones between. `intensity` makes the car
 * travel faster.
 */

function elevator(el: HTMLElement, options?: HairlineOptions): Figure {
  return create(
    {
      id: "elevator",
      label:
        "Four floors beside an open shaft. The pointer's height picks a floor, and the car travels there through the ones between.",
      rest: "rest",
      engine: elevatorEngine,
    },
    el,
    options,
  );
}

/** The figure's options, plus every `<div>` attribute except `children`. */
export type ElevatorProps = HairlineOptions &
  Omit<ComponentPropsWithoutRef<"div">, "children" | keyof HairlineOptions>;
type ElevatorComponent = ForwardRefExoticComponent<ElevatorProps & RefAttributes<HTMLDivElement>>;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const Elevator: ElevatorComponent = forwardRef<HTMLDivElement, ElevatorProps>(function Hairline(props, ref) {
  const { intensity, theme, label, onRead, style, ...attrs } = props;
  /* aria-label stays on the div and is the figure's label too, so the two never disagree about the name */
  const named = label ?? props["aria-label"];

  const el = useRef<HTMLDivElement | null>(null);
  const figure = useRef<Figure | null>(null);
  const read = useRef(onRead);
  const set = useCallback(
    (node: HTMLDivElement | null) => {
      el.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );

  useIsoLayoutEffect(() => {
    read.current = onRead;
  });

  useIsoLayoutEffect(() => {
    const f = elevator(el.current!, { intensity, theme, label: named, onRead: (text) => read.current?.(text) });
    figure.current = f;
    return () => {
      f.destroy();
      figure.current = null;
    };
    // mounts once; options reach the figure through the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* every key is sent, so a prop that was removed goes back to its default */
  useIsoLayoutEffect(() => {
    figure.current?.update({ intensity, theme, label: named });
  }, [intensity, theme, named]);

  return <div {...attrs} ref={set} style={{ aspectRatio: "5 / 4", ...style }} />;
});
Elevator.displayName = "Elevator";

export default Elevator;
