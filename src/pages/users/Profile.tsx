import { ReactNode, useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Separator } from "../../components/ui/separator";
import { Skeleton } from "../../components/ui/skeleton";

type UserProfile = {
  userId?: number;
  email?: string;
  name?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  isDelete?: boolean;
};

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right max-w-[60%] break-words">
        {value}
      </span>
    </div>
  );
}

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const initials =
    (profile?.name ?? profile?.email ?? "?")
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  const formatDate = (value?: string) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/user/me", { credentials: "include" });
      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");

      const body = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        const bodyPreview =
          typeof body === "string"
            ? body
            : JSON.stringify(body ?? {}, null, 2);
        throw new Error(
          `HTTP ${response.status} ${response.statusText}. ${bodyPreview.slice(0, 200)}`,
        );
      }

      if (!isJson || !body) {
        const bodyPreview = typeof body === "string" ? body : "";
        throw new Error(
          `Unexpected content-type: ${contentType || "unknown"}. ${bodyPreview.slice(0, 200)}`,
        );
      }

      if (isMountedRef.current) {
        setProfile(body as UserProfile);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
      if (isMountedRef.current) {
        setError(message);
        setProfile(null);
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchProfile();
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const statusBadge =
    isLoading && !profile ? (
      <Skeleton className="h-5 w-16" />
    ) : profile ? (
      <Badge
        variant={profile.isDelete ? "destructive" : "secondary"}
        className={profile.isDelete ? "" : "bg-emerald-100 text-emerald-700"}
      >
        {profile.isDelete ? "비활성" : "활성"}
      </Badge>
    ) : (
      "-"
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">프로필</h1>
          <p className="text-muted-foreground">
            내 계정 정보를 확인하고 상태를 점검하세요.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-1">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="size-14 bg-primary/10 text-primary">
                <AvatarFallback className="text-lg font-semibold">
                  {isLoading ? "…" : initials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <CardTitle className="text-xl">
                  {isLoading ? <Skeleton className="h-5 w-32" /> : profile?.name || "이름 없음"}
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2">
                  {isLoading ? (
                    <Skeleton className="h-4 w-44" />
                  ) : (
                    <>
                      <span>{profile?.email ?? "-"}</span>
                      {profile?.role === "ROLE_USER" && <Badge variant="secondary">사용자</Badge>}
                      {/* role이 user면? 사용자라고 표기하고 싶 */}
                    </>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-1">
            <InfoRow
              label="사용자 ID"
              value={
                isLoading ? (
                  <Skeleton className="h-4 w-16" />
                ) : (
                  profile?.userId ?? "-"
                )
              }
            />
            <InfoRow label="상태" value={statusBadge} />
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">계정 상세</CardTitle>
            <CardDescription>가입 정보 및 현재 상태</CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <InfoRow
                label="이메일"
                value={
                  isLoading ? (
                    <Skeleton className="h-4 w-48" />
                  ) : (
                    profile?.email ?? "-"
                  )
                }
              />
              <InfoRow
                label="권한"
                value={
                  isLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    profile?.role ?? "-"
                  )
                }
              />
              <InfoRow label="계정 상태" value={statusBadge} />
            </div>
            <div className="space-y-2">
              <InfoRow
                label="생성일"
                value={
                  isLoading ? (
                    <Skeleton className="h-4 w-40" />
                  ) : (
                    formatDate(profile?.createdAt)
                  )
                }
              />
              <InfoRow
                label="최근 업데이트"
                value={
                  isLoading ? (
                    <Skeleton className="h-4 w-40" />
                  ) : (
                    formatDate(profile?.updatedAt)
                  )
                }
              />
              <InfoRow
                label="삭제 플래그"
                value={
                  isLoading ? (
                    <Skeleton className="h-4 w-28" />
                  ) : profile?.isDelete != null ? (
                    profile.isDelete ? "예" : "아니요"
                  ) : (
                    "-"
                  )
                }
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
