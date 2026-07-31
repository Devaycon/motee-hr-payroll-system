import { getInitials } from "@/src/lib/types/dashboard";
import { personPhotoUrl } from "@/src/lib/utils/avatar";
import { cn } from "@/src/lib/utils";

/**
 * A person's photo as a plain `<img>`, for the places that style their own
 * image rather than using the `Avatar` primitive (org chart nodes, profile
 * headers).
 *
 * Falls back to initials when there's no photo to show — which includes people
 * who have declined to state a gender, since the portrait set is split into men
 * and women and either choice would misrepresent them.
 */
export function PersonPhoto({
  name,
  gender,
  initials,
  className,
  fallbackClassName,
}: {
  name: string;
  gender?: string | null;
  initials?: string;
  /** Classes for the image / fallback box — pass the same sizing either way. */
  className?: string;
  fallbackClassName?: string;
}) {
  const src = personPhotoUrl(name, gender);
  if (!src) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-primary/10 font-semibold text-primary",
          className,
          fallbackClassName,
        )}
        aria-label={name}
        role="img"
      >
        {initials ?? getInitials(name)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className={cn("object-cover", className)} />
  );
}
