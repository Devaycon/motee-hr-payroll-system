import { CardGridSkeleton } from "@/src/components/shared/skeletons/card-grid-skeleton";

export default function Loading() {
  return <CardGridSkeleton count={9} columns={3} />;
}
