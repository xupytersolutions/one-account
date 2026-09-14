import { ICON_MAP } from "../constants/icons";

type IconProps = {
  icon: string | null;
  className?: string;
};

export function Icon({ icon, className = "w-5 h-5" }: IconProps) {
  if (!icon) return null;
  const Component = ICON_MAP[icon];
  if (Component) {
    return <Component className={className} />;
  }
  if (icon.length <= 4) {
    return <span className="text-lg leading-none">{icon}</span>;
  }
  return null;
}
