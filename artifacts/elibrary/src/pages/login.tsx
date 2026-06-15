import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Library, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await loginMutation.mutateAsync({ data: { email, password } });
      login(result.token, result.user);
      setLocation("/");
    } catch {
      toast({ title: "Invalid email or password", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex relative overflow-hidden">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden flex-col justify-between p-12">
        {/* Background Logo Seal Watermark */}
        <div className="absolute -right-12 -bottom-12 w-96 h-96 opacity-10 pointer-events-none select-none">
          <img src="/logo.jpg" alt="" className="w-full h-full object-contain filter invert brightness-200" />
        </div>

        <div className="flex items-center gap-3 z-10">
          <img src="/logo.jpg" alt="ZDSPGC Logo" className="w-9 h-9 rounded-full bg-white p-0.5 object-cover shrink-0" />
          <div>
            <p className="font-bold text-lg text-primary-foreground leading-tight">ZDSPGC E-Library</p>
            <p className="text-primary-foreground/70 text-xs leading-tight">Zamboanga del Sur Provincial Government College</p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center flex-1 my-8 z-10 text-center">
          <div className="w-32 h-32 rounded-full bg-white p-1.5 shadow-xl hover:scale-105 transition-transform duration-300">
            <img src="/logo.jpg" alt="ZDSPGC Seal" className="w-full h-full rounded-full object-cover" />
          </div>
          <h2 className="text-xl font-bold font-serif text-primary-foreground mt-5">Zamboanga del Sur Provincial Government College</h2>
          <p className="text-primary-foreground/80 text-xs max-w-xs mt-2.5 leading-relaxed">
            Empowering students and faculty through integrated digital academic collections and physical library resources.
          </p>
        </div>

        <div className="text-primary-foreground/50 text-xs z-10">
          Zamboanga del Sur Provincial Government College — E-Library System
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-8 z-10 relative">
        {/* Background watermark overlay for mobile */}
        <div className="lg:hidden absolute inset-0 opacity-[0.03] pointer-events-none select-none flex items-center justify-center">
          <img src="/logo.jpg" alt="" className="w-80 h-80 object-contain" />
        </div>

        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <img src="/logo.jpg" alt="ZDSPGC Logo" className="w-8 h-8 rounded-full bg-white p-0.5 object-cover shrink-0" />
            <div>
              <p className="font-bold text-base text-primary leading-tight">ZDSPGC E-Library</p>
              <p className="text-muted-foreground text-xs leading-tight">Zamboanga del Sur Provincial Government College</p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
          <p className="text-muted-foreground text-sm mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="username@zdspgc.edu.ph"
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
