import React from "react";

export const getHighlightStyles = (mantineColorToken = "orange-5"): React.CSSProperties => {
    return {
        backgroundColor: `var(--mantine-color-${mantineColorToken})`,
        fontWeight: 700,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
    } as React.CSSProperties;
};