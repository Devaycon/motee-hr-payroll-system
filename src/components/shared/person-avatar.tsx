import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { getInitials } from "@/src/lib/types/dashboard";
import { personPhotoUrl } from "@/src/lib/utils/avatar";

interface PersonAvatarProps {
  /** Person's full name — used as the photo seed and initials source. */
  name: string;
  /** Pre-computed initials (falls back to deriving from name). */
  initials?: string;
  /** "male"/"female" when known; otherwise derived from the name. */
  gender?: string | null;
  size?: "sm" | "default" | "lg";
  /** Classes for the Avatar root. */
  className?: string;
  /** Classes for the initials fallback (preserve each site's styling). */
  fallbackClassName?: string;
}

/**
 * A person's avatar that shows a real, deterministic profile photo with the
 * initials as a graceful load/error fallback. Drop-in replacement for the
 * `Avatar` + `AvatarFallback` initials pattern used across the app.
 */
export function PersonAvatar({
  name,
  initials,
  gender,
  size,
  className,
  fallbackClassName,
}: PersonAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      <AvatarImage src={personPhotoUrl(name, gender)} alt={name} />
      <AvatarFallback className={fallbackClassName}>
        {initials ?? getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
