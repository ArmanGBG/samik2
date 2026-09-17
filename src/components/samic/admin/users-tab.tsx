"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { api, AdminOverview } from "../api";
import { fullName } from "../shared/format";
import { toPersianDigitsSafe, toJalaliLong } from "@/lib/jalali";
import { EmptyState, ProfileStatusBadge, RoleBadge, SectionHeader, type AdminUser } from "./panel-bits";
import {
  UserPlus,
  Search,
  UserRoundSearch,
  RotateCcw,
  MoreHorizontal,
  Pencil,
  Trash2,
  Loader2,
  Users,
} from "lucide-react";

interface UsersTabProps {
  users: AdminOverview["users"];
  onRefresh: () => void;
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

function toEnglishDigitsLocal(s: string): string {
  return s
    .replace(/[۰-۹]/g, (d) => String(FA_DIGITS.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

const ROLE_OPTIONS = [
  { value: "TEACHER", label: "معلم" },
  { value: "STUDENT", label: "دانش‌آموز" },
  { value: "INSTITUTE_MANAGER", label: "مدیر آموزشگاه" },
];

const EDIT_ROLE_OPTIONS = [
  ...ROLE_OPTIONS,
  { value: "SUPER_ADMIN", label: "مدیر کل" },
];

interface RegisterResult {
  message: string;
  user: {
    id: string;
    mobile: string;
    role: string;
    teacherCode: string | null;
    studentCode: string | null;
  };
}

export function UsersTab({ users, onRefresh }: UsersTabProps) {
  const { toast } = useToast();

  // --- filters ---
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // --- register dialog ---
  const [regOpen, setRegOpen] = useState(false);
  const [regMobile, setRegMobile] = useState("");
  const [regRole, setRegRole] = useState("");
  const [regName, setRegName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [registering, setRegistering] = useState(false);

  // --- edit dialog ---
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editing, setEditing] = useState(false);

  // --- delete confirm ---
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const q = toEnglishDigitsLocal(query.trim().toLowerCase());
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        `${u.name ?? ""} ${u.lastName ?? ""}`.toLowerCase().includes(q) ||
        toEnglishDigitsLocal(u.mobile).includes(q) ||
        (u.teacherCode ?? u.studentCode ?? "").toLowerCase().includes(q) ||
        (u.instituteName ?? "").toLowerCase().includes(q)
      );
    });
  }, [users, query, roleFilter]);

  const submitRegister = async () => {
    if (!regMobile.trim() || !regRole) return;
    setRegistering(true);
    const res = await api<RegisterResult>("/api/admin/users", {
      method: "POST",
      body: {
        mobile: regMobile.trim(),
        role: regRole,
        name: regName.trim() || undefined,
        lastName: regLastName.trim() || undefined,
      },
    });
    setRegistering(false);
    if (!res.ok) {
      toast({ title: res.error ?? "خطا در ثبت کاربر", variant: "destructive" });
      return;
    }
    const u = res.data?.user;
    const code = u?.teacherCode ?? u?.studentCode ?? null;
    toast({
      title: res.data?.message ?? "کاربر ثبت شد",
      description: code ? (
        <span dir="ltr" className="font-mono font-bold tracking-wide">
          {code}
        </span>
      ) : undefined,
    });
    setRegOpen(false);
    setRegMobile("");
    setRegRole("");
    setRegName("");
    setRegLastName("");
    onRefresh();
  };

  const startEdit = (u: AdminUser) => {
    setEditUser(u);
    setEditName(u.name ?? "");
    setEditLastName(u.lastName ?? "");
    setEditRole(u.role);
  };

  const submitEdit = async () => {
    if (!editUser) return;
    setEditing(true);
    const res = await api<{ message: string }>(`/api/admin/users/${editUser.id}`, {
      method: "PATCH",
      body: {
        name: editName.trim(),
        lastName: editLastName.trim(),
        role: editRole,
      },
    });
    setEditing(false);
    if (!res.ok) {
      toast({ title: res.error ?? "خطا در ویرایش کاربر", variant: "destructive" });
      return;
    }
    toast({ title: res.data?.message ?? "کاربر ویرایش شد" });
    setEditUser(null);
    onRefresh();
  };

  const submitDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    const res = await api<{ message: string }>(`/api/admin/users/${deleteUser.id}`, {
      method: "DELETE",
    });
    setDeleting(false);
    if (!res.ok) {
      toast({ title: res.error ?? "خطا در حذف کاربر", variant: "destructive" });
      return;
    }
    toast({ title: res.data?.message ?? "کاربر حذف شد" });
    setDeleteUser(null);
    onRefresh();
  };

  return (
    <section aria-label="مدیریت کاربران">
      <SectionHeader
        title="کاربران سامانه"
        description={`${toPersianDigitsSafe(filtered.length)} از ${toPersianDigitsSafe(users.length)} کاربر`}
        actions={
          <Button className="h-11 cursor-pointer gap-1.5" onClick={() => setRegOpen(true)}>
            <UserPlus className="size-4" />
            ثبت کاربر
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجوی نام، موبایل، شناسه یا آموزشگاه…"
            className="h-11 pr-9 bg-card"
            aria-label="جستجوی کاربران"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter} dir="rtl">
          <SelectTrigger className="w-full sm:w-44 h-11 bg-card cursor-pointer" aria-label="فیلتر نقش">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL" className="cursor-pointer">همه نقش‌ها</SelectItem>
            {ROLE_OPTIONS.map((r) => (
              <SelectItem key={r.value} value={r.value} className="cursor-pointer">
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {users.length === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="هنوز کاربری ثبت نشده است"
          description="با دکمه «ثبت کاربر» می‌توانید معلمان، دانش‌آموزان و مدیران آموزشگاه را به‌صورت دستی ثبت کنید."
          action={
            <Button className="h-11 cursor-pointer gap-1.5" onClick={() => setRegOpen(true)}>
              <UserPlus className="size-4" />
              ثبت کاربر
            </Button>
          }
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<UserRoundSearch className="size-6" />}
          title="نتیجه‌ای یافت نشد"
          description="عبارت دیگری را امتحان کنید یا فیلترها را بازنشانی کنید."
          action={
            <Button
              variant="outline"
              className="h-11 cursor-pointer gap-1.5"
              onClick={() => {
                setQuery("");
                setRoleFilter("ALL");
              }}
            >
              <RotateCcw className="size-4" />
              بازنشانی فیلترها
            </Button>
          }
        />
      ) : (
        <div className="rounded-xl border border-border/80 bg-card overflow-hidden">
          <div className="max-h-[480px] overflow-auto scroll-samic">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50">
                  <TableHead className="text-right">کاربر</TableHead>
                  <TableHead className="text-right hidden md:table-cell">موبایل</TableHead>
                  <TableHead className="text-right">نقش</TableHead>
                  <TableHead className="text-right hidden sm:table-cell">شناسه</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">آموزشگاه</TableHead>
                  <TableHead className="text-right">پروفایل</TableHead>
                  <TableHead className="text-right hidden xl:table-cell">شهر</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">تاریخ ثبت</TableHead>
                  <TableHead className="text-right w-12">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="font-medium">{fullName(u.name, u.lastName)}</div>
                      <div
                        dir="ltr"
                        className="sm:hidden font-mono text-[10px] text-muted-foreground mt-0.5"
                      >
                        {u.teacherCode ?? u.studentCode ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell
                      dir="ltr"
                      className="hidden md:table-cell text-muted-foreground text-sm"
                    >
                      {toPersianDigitsSafe(u.mobile)}
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={u.role} />
                    </TableCell>
                    <TableCell
                      dir="ltr"
                      className="hidden sm:table-cell font-mono text-xs text-muted-foreground"
                    >
                      {u.teacherCode ?? u.studentCode ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-sm">
                      <span className="block max-w-[160px] truncate" title={u.instituteName ?? ""}>
                        {u.instituteName ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ProfileStatusBadge completed={u.profileCompleted} />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell text-muted-foreground text-sm">
                      {u.city ?? "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground text-xs whitespace-nowrap">
                      {toJalaliLong(u.createdAt)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 cursor-pointer"
                            aria-label={`عملیات برای ${fullName(u.name, u.lastName)}`}
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => startEdit(u)}
                            className="cursor-pointer gap-2"
                          >
                            <Pencil className="size-4" />
                            ویرایش
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteUser(u)}
                            className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="size-4" />
                            حذف
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* ---------- Register user dialog ---------- */}
      <Dialog open={regOpen} onOpenChange={setRegOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <DialogHeader className="text-right sm:text-right">
            <div className="mx-auto sm:mx-0 mb-2 size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
              <UserPlus className="size-6" />
            </div>
            <DialogTitle className="text-xl">ثبت کاربر جدید</DialogTitle>
            <DialogDescription>
              شماره موبایل و نقش الزامی است؛ شناسه TCH یا STU به‌صورت خودکار تولید می‌شود.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!registering) submitRegister();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="reg-mobile">شماره موبایل</Label>
              <Input
                id="reg-mobile"
                dir="ltr"
                inputMode="numeric"
                value={regMobile}
                onChange={(e) => setRegMobile(e.target.value)}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className="h-12 text-center text-lg tracking-widest"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reg-role">نقش</Label>
              <Select value={regRole} onValueChange={setRegRole} dir="rtl">
                <SelectTrigger id="reg-role" className="w-full h-11 cursor-pointer">
                  <SelectValue placeholder="انتخاب نقش" />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="cursor-pointer">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="reg-name">
                  نام <span className="text-muted-foreground font-normal">(اختیاری)</span>
                </Label>
                <Input
                  id="reg-name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="نام"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-lastname">
                  نام خانوادگی <span className="text-muted-foreground font-normal">(اختیاری)</span>
                </Label>
                <Input
                  id="reg-lastname"
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  placeholder="نام خانوادگی"
                  className="h-11"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="h-11 cursor-pointer"
                onClick={() => setRegOpen(false)}
                disabled={registering}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                className="h-11 cursor-pointer flex-1 sm:flex-none"
                disabled={registering || !regMobile.trim() || !regRole}
              >
                {registering ? (
                  <>
                    <Loader2 className="size-4 ml-1 animate-spin" />
                    در حال ثبت…
                  </>
                ) : (
                  "ثبت کاربر"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------- Edit user dialog ---------- */}
      <Dialog
        open={editUser !== null}
        onOpenChange={(o) => {
          if (!o) setEditUser(null);
        }}
      >
        <DialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <DialogHeader className="text-right sm:text-right">
            <div className="mx-auto sm:mx-0 mb-2 size-12 rounded-2xl bg-primary/10 text-primary grid place-items-center">
              <Pencil className="size-6" />
            </div>
            <DialogTitle className="text-xl">ویرایش کاربر</DialogTitle>
            <DialogDescription>
              {editUser
                ? `ویرایش اطلاعات «${fullName(editUser.name, editUser.lastName)}» — ${toPersianDigitsSafe(editUser.mobile)}`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!editing) submitEdit();
            }}
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="edit-name">نام</Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-11"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lastname">نام خانوادگی</Label>
                <Input
                  id="edit-lastname"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">نقش</Label>
              <Select value={editRole} onValueChange={setEditRole} dir="rtl">
                <SelectTrigger id="edit-role" className="w-full h-11 cursor-pointer">
                  <SelectValue placeholder="انتخاب نقش" />
                </SelectTrigger>
                <SelectContent>
                  {EDIT_ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="cursor-pointer">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground leading-5">
                تغییر نقش مدیر آموزشگاه که آموزشگاهی دارد، ممکن نیست؛ ابتدا آموزشگاه را حذف کنید.
              </p>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                className="h-11 cursor-pointer"
                onClick={() => setEditUser(null)}
                disabled={editing}
              >
                انصراف
              </Button>
              <Button
                type="submit"
                className="h-11 cursor-pointer flex-1 sm:flex-none"
                disabled={editing || !editRole}
              >
                {editing ? (
                  <>
                    <Loader2 className="size-4 ml-1 animate-spin" />
                    در حال ذخیره…
                  </>
                ) : (
                  "ذخیره تغییرات"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ---------- Delete user confirm ---------- */}
      <AlertDialog
        open={deleteUser !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteUser(null);
        }}
      >
        <AlertDialogContent className="sm:max-w-md rounded-2xl" dir="rtl">
          <AlertDialogHeader className="text-right sm:text-right">
            <AlertDialogTitle className="flex items-center gap-2">
              <span className="size-9 rounded-xl bg-red-500/10 text-red-600 grid place-items-center shrink-0">
                <Trash2 className="size-4.5" />
              </span>
              حذف کاربر
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-6">
              آیا از حذف «{deleteUser ? fullName(deleteUser.name, deleteUser.lastName) : ""}» مطمئن
              هستید؟ حضوروغیاب‌ها، عضویت‌ها و درخواست‌های این کاربر نیز حذف می‌شوند و این عمل قابل
              بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="h-11 cursor-pointer" disabled={deleting}>
              انصراف
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-11 cursor-pointer bg-destructive text-white hover:bg-destructive/90 flex items-center gap-1.5"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                submitDelete();
              }}
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              {deleting ? "در حال حذف…" : "حذف قطعی"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

/** Skeleton placeholder shown while the overview is loading */
export function UsersTabSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-11 w-32 rounded-md" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-md" />
        <Skeleton className="h-11 w-44 rounded-md" />
      </div>
      <div className="rounded-xl border overflow-hidden">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-none border-b border-border/60 last:border-0" />
        ))}
      </div>
    </div>
  );
}
