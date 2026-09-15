import { Toaster as Sonner, type ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-right"
      closeButton
      richColors
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--paper)",
          "--normal-text": "var(--ink)",
          "--normal-border": "var(--line)",
          "--success-bg": "#e5f6f3",
          "--success-text": "#126b65",
          "--success-border": "#b9e4df",
          "--error-bg": "#ffefee",
          "--error-text": "#a83f3a",
          "--error-border": "#f2c9c6",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
