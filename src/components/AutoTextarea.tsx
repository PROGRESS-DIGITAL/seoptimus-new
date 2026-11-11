"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef } from "react";

type Props = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  /** До какой высоты растягиваться само, в процентах высоты экрана. Дальше появляется прокрутка. */
  maxVh?: number;
};

/**
 * Поле ввода, которое растёт вместе с текстом. Ещё его можно растянуть за уголок:
 * растянутую вручную высоту поле запоминает и не сжимается обратно, пока текст не очищен.
 */
const AutoTextarea = forwardRef<HTMLTextAreaElement, Props>(function AutoTextarea(
  { maxVh = 40, className = "", value, onInput, ...props },
  ref,
) {
  const el = useRef<HTMLTextAreaElement>(null);
  const manual = useRef(0);
  const lastSet = useRef(0);
  useImperativeHandle(ref, () => el.current!);

  const fit = useCallback(() => {
    const t = el.current;
    if (!t) return;
    if (!t.value) manual.current = 0;
    const max = Math.round((window.innerHeight * maxVh) / 100);
    t.style.height = "auto";
    const content = t.scrollHeight + (t.offsetHeight - t.clientHeight);
    const h = Math.max(Math.min(content, max), manual.current);
    t.style.height = `${h}px`;
    t.style.overflowY = content > h ? "auto" : "hidden";
    lastSet.current = h;
  }, [maxVh]);

  useLayoutEffect(fit, [value, fit]);

  useEffect(() => {
    const t = el.current;
    if (!t) return;
    // Тянут за уголок: после отпускания запоминаем новую высоту
    const down = () => {
      const up = () => {
        if (Math.abs(t.offsetHeight - lastSet.current) > 2) {
          manual.current = t.offsetHeight;
          lastSet.current = t.offsetHeight;
          t.style.overflowY = t.scrollHeight > t.clientHeight ? "auto" : "hidden";
        }
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointerup", up);
    };
    t.addEventListener("pointerdown", down);
    window.addEventListener("resize", fit);
    return () => {
      t.removeEventListener("pointerdown", down);
      window.removeEventListener("resize", fit);
    };
  }, [fit]);

  return (
    <textarea
      ref={el}
      value={value}
      onInput={(e) => {
        fit();
        onInput?.(e);
      }}
      className={"auto-textarea resize-y " + className}
      {...props}
    />
  );
});

export default AutoTextarea;
