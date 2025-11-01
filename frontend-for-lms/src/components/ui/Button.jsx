import React from "react";
import "./Button.css";

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  disabled = false,
  ...props
}) {
  const classes = ["btn-app", `btn-${variant}`, `btn-${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
}
