import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const isRegistering = authMode === "register";

  const extractDetailMessage = async (response: Response) => {
    try {
      const body = await response.clone().json();
      const detail =
        typeof body?.detail === "string"
          ? body.detail
          : typeof body?.message === "string"
          ? body.message
          : typeof body?.error === "string"
          ? body.error
          : undefined;
      const title =
        typeof body?.title === "string" ? body.title : response.statusText;
      const fallback = response.statusText || "요청 실패";
      return detail || title || fallback;
    } catch {
      return response.statusText || "요청 실패";
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        const { getApiUrl, getApiOptions } = await import("../../utils/api");
        const response = await fetch(getApiUrl("/api/user/register"), {
          ...getApiOptions({
            method: "POST",
            body: JSON.stringify({ email, password, name }),
          }),
        });

        if (!response.ok) {
          const message =
            (await extractDetailMessage(response)) ||
            "회원가입에 실패했습니다. 입력 정보를 확인해주세요.";
          throw new Error(message);
        }

        setInfo("회원가입이 완료되었습니다. 로그인해 주세요.");
        setAuthMode("login");
        return;
      }

      const { getApiUrl, getApiOptions } = await import("../../utils/api");
      const response = await fetch(getApiUrl("/api/auth/login"), {
        ...getApiOptions({
          method: "POST",
          body: JSON.stringify({ email, password }),
        }),
      });

      if (!response.ok) {
        const message =
          (await extractDetailMessage(response)) ||
          "로그인에 실패했습니다. 다시 시도해주세요.";
        throw new Error(message);
      }

      await response.json();
      onLogin();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "요청 처리 중 오류가 발생했습니다.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

 

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-sidebar/5">
      {/* Background accents using existing palette */}
      <div className="absolute inset-0">
        <div className="absolute -left-24 top-6 h-64 w-64 rounded-full bg-sidebar-primary/25 blur-3xl" />
        <div className="absolute right-0 top-28 h-72 w-72 rounded-full bg-sidebar-accent/25 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
      </div>
      <br></br>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10  py-12 lg:flex-row w-100 justify-center">
        <div className="space-y-6 items-center justify-center">
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold leading-tight text-foreground md:text-4xl">
              AURA
            </h1>
            <p className="text-muted-foreground">
              AI를 통해 컨텐츠 생성 → 업로드 → 포스팅을 자동화하세요. 
              Human-in-the-loop을 통해 최적화된 컨텐츠를 제공합니다.
            </p>
          </div>
        <Card className="w-full max-w-lg border border-sidebar-primary/30 bg-card/90 shadow-[0_20px_70px_-30px_rgba(34,197,94,0.55)] backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-semiboldbg-sidebar-primary-foreground text-foreground">로그인</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              AURA에 로그인하기 위해 사내 계정 또는 이메일을 입력하세요.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              {info && (
                <div className="rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
                  {info}
                </div>
              )}

              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="name">이름</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      type="text"
                      autoComplete="name"
                      required={isRegistering}
                      placeholder="홍길동"
                      className="pl-10"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@company.com"
                    className="pl-10"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    required
                    autoComplete={
                      isRegistering ? "new-password" : "current-password"
                    }
                    placeholder="••••••••"
                    className="pl-10"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center justify-left text-sm">
                <button
                  type="button"
                  className="text-primary transition-colors hover:text-primary"
                >
                  비밀번호 찾기
                </button>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="group h-11 w-full bg-sidebar-primary-foreground from-sidebar-primary to-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all hover:brightness-105 disabled:opacity-60">
                <LogIn className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                {isRegistering ? "회원가입" : "로그인"}
              </Button>
              <Button
              type="button"
              variant="outline"
              className="w-full border-dashed border-sidebar-primary/50 text-foreground hover:border-sidebar-primary hover:text-foreground"
              onClick={() => {
                setAuthMode(isRegistering ? "login" : "register");
                setError(null);
                setInfo(null);
              }} >
              {isRegistering ? "로그인으로 돌아가기" : "회원가입"}
            </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);}
