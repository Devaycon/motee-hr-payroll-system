import dynamic from "next/dynamic";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "User Management" };

const UsersPage = dynamic(() =>
  import("@/src/components/hr/users").then((m) => ({
    default: m.UsersPage,
  })),
);

export default function Page() {
  return <UsersPage />;
}
