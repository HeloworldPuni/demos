
export const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

export const scaleTap = {
    tap: { scale: 0.95 },
};

export const scaleHover = {
    hover: { scale: 1.03 },
};

export const slideLeft = {
    hidden: { x: 30, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.3 } },
};
