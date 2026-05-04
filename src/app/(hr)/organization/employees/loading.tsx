import { TableSkeleton } from "@/src/components/shared/skeletons/table-skeleton";

export default function Loading() {
  return <TableSkeleton rows={10} columns={6} />;
}
