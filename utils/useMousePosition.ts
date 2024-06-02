import { useCallback, useState } from "react";

interface Point {
  x: number | null;
  y: number | null;
}

export const useMousePosition = () => {
  const [initialMousePosition, setInitialMousePosition] = useState<Point>({
    x: null,
    y: null,
  });
  const [mousePosition, setMousePosition] = useState<Point>({
    x: null,
    y: null,
  });
  const [isHovering, setIsHovering] = useState(false);

  const getMousePosition = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const box = target.getBoundingClientRect();

    return {
      x: e.pageX - box.left,
      y: e.pageY - box.top,
    };
  }, []);

  const onMouseMove = useCallback(
    (e: React.MouseEvent) => {
      setMousePosition(getMousePosition(e));
    },
    [getMousePosition]
  );

  const onMouseLeave = useCallback(() => {
    setIsHovering(false);
    setInitialMousePosition({
      x: null,
      y: null,
    });
  }, []);

  const onMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      setIsHovering(true);
      setInitialMousePosition(getMousePosition(e));
    },
    [getMousePosition]
  );

  return {
    isHovering,
    initialPoint: initialMousePosition,
    point: mousePosition,
    props: { onMouseMove, onMouseLeave, onMouseEnter },
  };
};
