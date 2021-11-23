import makeClass from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";

interface ScrubberBarProps
  extends Omit<React.ComponentProps<"div">, "onChange"> {
  value: number;
  max: number;
  onChange: (newValue: number) => void;
}

export const ScrubberBar = ({
  max,
  value,
  className,
  onClick,
  onChange,
  onMouseDown,
  ...props
}: ScrubberBarProps) => {
  const isDragging = useRef(false);
  const [showThumb, setShowThumb] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const setValue = useCallback(
    (pageX: number) => {
      const { x, width } = wrapperRef.current.getBoundingClientRect();
      const clickXBounded = Math.min(x + width, Math.max(x, pageX));
      const newValue = clickXBounded - x;
      const percent = newValue / width;

      onChange(percent * max);
    },
    [max, onChange]
  );

  useEffect(() => {
    function onMouseUp() {
      isDragging.current = false;
      setShowThumb(false);
    }

    function onMouseMove(e: MouseEvent) {
      if (!isDragging.current) {
        return;
      }

      setValue(e.pageX);
    }

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);

    return () => {
      document.removeEventListener("mouseup", onMouseUp);
      document.removeEventListener("mousemove", onMouseMove);
    };
  }, [max, setValue]);

  return (
    <div
      ref={wrapperRef}
      className={makeClass("rounded group flex items-center", className)}
      onClick={(e) => {
        setValue(e.pageX);
        onClick?.(e);
      }}
      onMouseDown={(e) => {
        isDragging.current = true;
        e.preventDefault();
        onMouseDown?.(e);
        setShowThumb(true);
      }}
      {...props}
    >
      <div className="h-1 w-full overflow-hidden relative">
        <div className="h-1 w-full absolute left-0 top-1/2 -translate-y-1/2 bg-gray-400" />
        <div
          style={{
            left: `${(value / max - 1) * 100}%`,
          }}
          className="h-1 w-full bg-gray-700 absolute top-1/2 -translate-y-1/2"
        />
      </div>
      <div
        style={{
          left: `${100 + (value / max - 1) * 100}%`,
        }}
        className={makeClass(
          "cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity h-4 w-4 bg-white rounded-full border border-gray-300 shadow-lg absolute top-1/2 -translate-y-1/2 -translate-x-1/2",
          showThumb && "opacity-100"
        )}
      />
      <div
        style={{ height: 20 }}
        className="w-full absolute top-0 left-0 cursor-pointer"
      />
    </div>
  );
};
