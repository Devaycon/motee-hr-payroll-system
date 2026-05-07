import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Reset Password — Motee Solutions",
  description: "Set your new Motee account password",
};

const ResetPasswordIndex = dynamic(
  () => import("@/src/components/auth/reset-password"),
);

export default function ResetPasswordPage() {
  return <ResetPasswordIndex />;
}
