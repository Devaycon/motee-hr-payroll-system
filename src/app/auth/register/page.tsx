import { Metadata } from "next";
import dynamic from "next/dynamic";

export const metadata: Metadata = {
  title: "Register � Motee Solutions",
  description: "Create your organisation account on Motee Solutions",
};

const RegisterIndex = dynamic(() => import("@/src/components/auth/register"));

export default function RegisterPage() {
  return <RegisterIndex />;
}
