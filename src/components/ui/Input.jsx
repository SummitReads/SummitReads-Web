'use client'

import { useState } from "react";
import { C, font } from "@/lib/admin/constants";

export default function Input({ style: extraStyle, ...props }) {
  const [foc, setFoc] = useState(false);

  return (
    <input
      {...props}
      onFocus={e => { setFoc(true);  props.onFocus && props.onFocus(e); }}
      onBlur={e  => { setFoc(false); props.onBlur  && props.onBlur(e);  }}
      style={{
        width: "100%",
        padding: "9px 12px",
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${foc ? C.tealBd : C.border}`,
        borderRadius: 6,
        color: C.text,
        fontSize: "0.82rem",
        outline: "none",
        fontFamily: font.sans,
        boxSizing: "border-box",
        transition: "border-color 0.15s",
        boxShadow: foc ? "0 0 0 3px rgba(25,190,227,0.07)" : "none",
        ...extraStyle,
      }}
    />
  );
}
