import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useRegister, RegisterInputRole } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Library, Eye, EyeOff, ChevronLeft } from "lucide-react";

const CAMPUSES = [
  "Main Campus", "North Campus", "South Campus", "East Campus", "West Campus",
  "Engineering Campus", "Medical Campus", "Business Campus",
];

const COURSES = [
  "Bachelor of Science in Computer Science",
  "Bachelor of Science in Information Technology",
  "Bachelor of Science in Education",
  "Bachelor of Science in Nursing",
  "Bachelor of Science in Business Administration",
  "Bachelor of Science in Engineering",
  "Bachelor of Arts in Communication",
  "Bachelor of Science in Accountancy",
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    fullname: "", email: "", password: "", phone: "", address: "", campus: "", role: "student",
    studentNumber: "", course: "", year: "", section: "",
  });
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const isStudent = form.role === "student";
  const totalSteps = isStudent ? 3 : 2;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < totalSteps) { setStep(s => s + 1); return; }
    try {
      const result = await registerMutation.mutateAsync({
        data: {
          fullname: form.fullname,
          email: form.email,
          password: form.password,
          phone: form.phone,
          address: form.address,
          campus: form.campus,
          role: form.role as RegisterInputRole,
          studentNumber: isStudent ? form.studentNumber : undefined,
          course: isStudent ? form.course : undefined,
          year: isStudent ? form.year : undefined,
          section: isStudent ? form.section : undefined,
        },
      });
      login(result.token, result.user);
      toast({ title: "Account created successfully! Welcome to Athenaeum." });
      setLocation("/");
    } catch (err: any) {
      toast({ title: err?.data?.error || "Registration failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-8">
          <Library className="w-7 h-7 text-primary" />
          <span className="font-serif font-bold text-xl text-primary">Athenaeum</span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-1">Create your account</h1>
          <p className="text-muted-foreground text-sm">Step {step} of {totalSteps}</p>
          <div className="mt-3 flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>I am a</Label>
                <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="instructor">Instructor / Faculty</SelectItem>
                    <SelectItem value="librarian">Librarian</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.fullname} onChange={set("fullname")} placeholder="Juan dela Cruz" required />
              </div>
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input type="email" value={form.email} onChange={set("email")} placeholder="juan@university.edu.ph" required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPass ? "text" : "password"}
                    value={form.password}
                    onChange={set("password")}
                    placeholder="At least 8 characters"
                    required
                    minLength={8}
                    className="pr-10"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input value={form.phone} onChange={set("phone")} placeholder="+63 912 345 6789" required />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input value={form.address} onChange={set("address")} placeholder="Street, City, Province" required />
              </div>
              <div className="space-y-2">
                <Label>Campus</Label>
                <Select value={form.campus} onValueChange={(v) => setForm(f => ({ ...f, campus: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select campus" /></SelectTrigger>
                  <SelectContent>
                    {CAMPUSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 3 && isStudent && (
            <>
              <div className="space-y-2">
                <Label>Student Number</Label>
                <Input value={form.studentNumber} onChange={set("studentNumber")} placeholder="2024-00001" required />
              </div>
              <div className="space-y-2">
                <Label>Course / Program</Label>
                <Select value={form.course} onValueChange={(v) => setForm(f => ({ ...f, course: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year Level</Label>
                  <Select value={form.year} onValueChange={(v) => setForm(f => ({ ...f, year: v }))}>
                    <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                    <SelectContent>
                      {["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"].map(y => (
                        <SelectItem key={y} value={y}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Input value={form.section} onChange={set("section")} placeholder="e.g. A" required />
                </div>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(s => s - 1)} className="gap-2">
                <ChevronLeft className="w-4 h-4" /> Back
              </Button>
            )}
            <Button type="submit" className="flex-1" disabled={registerMutation.isPending || (step === 2 && !form.campus)}>
              {step < totalSteps ? "Continue" : registerMutation.isPending ? "Creating account..." : "Create Account"}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
