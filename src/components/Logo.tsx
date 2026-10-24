// Logo de Ronda de Tiro (public/logo.png).
export function Logo({ size = 48, className }: { size?: number; className?: string }) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}logo.png`}
      alt="Ronda de Tiro"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={className}
    />
  );
}
