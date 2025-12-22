// Hook to convert Tailwind classes to inline styles
import { tailwindToInline } from './tailwindToStyle';
import React from 'react';

export function useStyles(classString: string): React.CSSProperties {
  return React.useMemo(() => {
    const inlineStyles = tailwindToInline(classString);
    // Remove the __responsive metadata
    const { __responsive, ...styles } = inlineStyles;
    return styles;
  }, [classString]);
}

// Wrapper component that converts className to style
export const StyledDiv: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { className?: string }
> = ({ className = '', style, ...props }) => {
  const inlineStyles = useStyles(className);
  return <div style={{ ...inlineStyles, ...style }} {...props} />;
};

export const StyledButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }
> = ({ className = '', style, ...props }) => {
  const inlineStyles = useStyles(className);
  return <button style={{ ...inlineStyles, ...style }} {...props} />;
};

export const StyledInput: React.FC<
  React.InputHTMLAttributes<HTMLInputElement> & { className?: string }
> = ({ className = '', style, ...props }) => {
  const inlineStyles = useStyles(className);
  return <input style={{ ...inlineStyles, ...style }} {...props} />;
};

export const StyledSpan: React.FC<
  React.HTMLAttributes<HTMLSpanElement> & { className?: string }
> = ({ className = '', style, ...props }) => {
  const inlineStyles = useStyles(className);
  return <span style={{ ...inlineStyles, ...style }} {...props} />;
};
