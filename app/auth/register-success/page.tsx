import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import Image from "next/image";

export default function RegisterSuccessPage() {
  return (
    <div className="w-full max-w-md">
      <Card>
        <CardHeader className="space-y-2 text-center">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/cherith-logo.jpg"
              alt="Cherith Academy"
              width={160}
              height={160}
              className="object-contain"
            />
          </div>
          <CardTitle className="text-2xl">Welcome!</CardTitle>
          <CardDescription>
            Your account has been created successfully
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
            <p className="text-sm font-semibold text-green-900">
              Account Created
            </p>
            <p className="text-sm text-green-700">
              Go to your mail to confirm your registration before you login.
            </p>
          </div>
          <Link href="/auth/login" className="block">
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              Go to Login
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
