import * as React from "react";

export const Button = ({ onClick, children }) =>
    <button onClick={e => onClick()}>{children}</button>
