import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Forgot Password — Motee Solutions",
  description: "Reset your Motee account password",
};

const ForgotPasswordIndex = dynamic(
  () => import("@/src/components/auth/forgot-password"),
);

export default function ForgotPasswordPage() {
  return <ForgotPasswordIndex />;
}
