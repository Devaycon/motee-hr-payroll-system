import { CardGridSkeleton } from "@/src/components/shared/skeletons/card-grid-skeleton";

export default function Loading() {
  return <CardGridSkeleton count={6} columns={3} />;
}
