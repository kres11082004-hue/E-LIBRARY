import { useState } from "react";
import { useRegister } from "@workspace/api-client-react";
import type { RegisterInputRole } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation, Link } from "wouter";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Library, Eye, EyeOff, ChevronLeft } from "lucide-react";

const CAMPUSES = [
  "ZDSPGC-Aurora Campus",
  "ZDSPGC-Dimataling Campus",
  "ZDSPGC-Dumingag Campus",
  "ZDSPGC-Guipos Campus",
  "ZDSPGC-Josefina Campus",
  "ZDSPGC-Kumalarang Campus",
  "ZDSPGC-Lakewood Campus",
  "ZDSPGC-Lapuyan Campus",
  "ZDSPGC-Mahayag Campus",
  "ZDSPGC-Margosatubig Campus",
  "ZDSPGC-Midsalip Campus",
  "ZDSPGC-Molave Campus",
  "ZDSPGC-Pagadian Campus",
  "ZDSPGC-Ramon Magsaysay Campus",
  "ZDSPGC-San Pablo Campus",
  "ZDSPGC-Tambulig Campus",
  "ZDSPGC-Tigbao Campus",
  "ZDSPGC-Tukuran Campus",
  "ZDSPGC-Vincenzo Sagun Campus",
];

// Associate courses are 1st–2nd year only
const ASSOCIATE_COURSES = new Set([
  "Associate in Computer Technology",
]);

const COURSES = [
  "Bachelor of Science in Computer Science",
  "Bachelor of Science in Information Technology",
  "Bachelor of Science in Information System",
  "Bachelor of Science in Education",
  "Bachelor of Science in Nursing",
  "Bachelor of Science in Business Administration",
  "Bachelor of Science in Engineering",
  "Bachelor of Physical Education",
  "Bachelor of Arts in Communication",
  "Bachelor of Science in Accountancy",
  "Associate in Computer Technology",
];

const YEAR_OPTIONS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];
const ASSOCIATE_YEAR_OPTIONS = ["1st Year", "2nd Year"];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    fullname: "", email: "", password: "", phone: "", address: "", campus: "", role: "student",
    studentNumber: "", course: "", year: "", section: "",
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const registerMutation = useRegister();

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  const isStudent = form.role === "student";
  const totalSteps = isStudent ? 3 : 2;
  const isAssociate = ASSOCIATE_COURSES.has(form.course);
  const yearOptions = isAssociate ? ASSOCIATE_YEAR_OPTIONS : YEAR_OPTIONS;

  const handleCourseChange = (v: string) => {
    const newIsAssociate = ASSOCIATE_COURSES.has(v);
    setForm(f => ({
      ...f,
      course: v,
      // reset year if current year is invalid for the new course
      year: newIsAssociate && (f.year === "3rd Year" || f.year === "4th Year") ? "" : f.year,
    }));
  };

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
      toast({ title: "Account created successfully!", description: "Please sign in with your email and password." });
      setLocation("/login");
    } catch (err: any) {
      toast({ title: err?.data?.error || "Registration failed", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background watermark overlay */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none select-none flex items-center justify-center">
        <img src="/logo.jpg" alt="" className="w-[450px] h-[450px] object-contain" />
      </div>

      <div className="w-full max-w-lg z-10">
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.jpg" alt="ZDSPGC Logo" className="w-8 h-8 rounded-full bg-white p-0.5 object-cover shrink-0" />
          <div>
            <p className="font-bold text-base text-primary leading-tight">ZDSPGC E-Library</p>
            <p className="text-xs text-muted-foreground leading-tight">Zamboanga del Sur Provincial Government College</p>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Create your account</h1>
          <p className="text-muted-foreground text-sm mt-1">Step {step} of {totalSteps}</p>
          <div className="flex gap-1 mt-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${i < step ? "bg-primary" : "bg-muted"}`}
              />
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
                <Input type="email" value={form.email} onChange={set("email")} placeholder="username@zdspgc.edu.ph" required />
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
                <Select value={form.course} onValueChange={handleCourseChange}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {COURSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
                {isAssociate && (
                  <p className="text-xs text-amber-600">Associate programs are 1st–2nd year only.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Year Level</Label>
                  <Select value={form.year} onValueChange={(v) => setForm(f => ({ ...f, year: v }))}>
                    <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                    <SelectContent>
                      {yearOptions.map(y => (
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
