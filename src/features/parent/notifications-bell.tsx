"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, CheckCheck, FileText, GraduationCap } from "lucide-react";
import type { ParentNotification } from "@/application/notifications";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAsyncData } from "@/providers/use-async-data";
import { useSession } from "@/providers/session-provider";
import {
  markAllRead,
  notificationHref,
  notificationsStorageKey,
  notificationText,
  parseReadIds,
  relativeDay,
  unreadCount,
} from "./notifications-model";

/** Read state of this viewer; the bell still works when storage is blocked. */
function loadReadIds(parentId: string): string[] {
  try {
    return parseReadIds(window.localStorage.getItem(notificationsStorageKey(parentId)));
  } catch {
    return [];
  }
}

function saveReadIds(parentId: string, ids: string[]) {
  try {
    window.localStorage.setItem(notificationsStorageKey(parentId), JSON.stringify(ids));
  } catch {
    // Storage blocked: they come back as unread on the next visit.
  }
}

/** Container: bell with the unread count and the list of notices for the family. */
export function NotificationsBell() {
  const { state } = useSession();
  const parentId = state.session?.userId ?? "";
  const { data } = useAsyncData(`parent-notifications:${parentId}`, (s) =>
    s.parent.listNotifications(parentId),
  );
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<string[]>(() => loadReadIds(parentId));

  if (!data) return null;
  const unread = unreadCount(data.items, readIds);

  function update(next: string[]) {
    setReadIds(next);
    saveReadIds(parentId, next);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="relative size-11 text-navy"
          aria-label={
            unread === 0
              ? "Notificaciones, no hay nuevas"
              : `Notificaciones, ${unread === 1 ? "1 nueva" : `${unread} nuevas`}`
          }
        >
          <Bell className="size-6" aria-hidden />
          {unread > 0 && (
            <span
              aria-hidden
              className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-xs leading-5 font-semibold text-white tabular-nums"
            >
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(24rem,calc(100vw-2rem))] p-0">
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="font-serif text-lg font-semibold text-navy">Notificaciones</h2>
          <Button
            variant="ghost"
            className="h-10 gap-2 px-3 text-[15px]"
            disabled={unread === 0}
            onClick={() => update(markAllRead(data.items, readIds))}
          >
            <CheckCheck aria-hidden />
            Marcar todas como leídas
          </Button>
        </div>
        {data.items.length === 0 ? (
          <p className="px-4 py-6 text-[15px] text-muted-foreground">
            No hay notificaciones por ahora.
          </p>
        ) : (
          <ul className="max-h-[min(28rem,70vh)] divide-y divide-border overflow-y-auto">
            {data.items.map((n) => (
              <li key={n.id}>
                <NotificationRow
                  notification={n}
                  today={data.today}
                  unread={!readIds.includes(n.id)}
                  onOpen={() => {
                    update(markAllRead([n], readIds));
                    setOpen(false);
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

function NotificationRow({
  notification,
  today,
  unread,
  onOpen,
}: {
  notification: ParentNotification;
  today: string;
  unread: boolean;
  onOpen: () => void;
}) {
  const Icon = notification.kind === "report-card" ? FileText : GraduationCap;
  return (
    <Link
      href={notificationHref(notification)}
      onClick={onOpen}
      className={cn(
        "flex min-h-14 items-start gap-3 px-4 py-3 text-[15px] hover:bg-primary-tint focus-visible:bg-primary-tint focus-visible:outline-none",
        unread && "bg-primary-tint/50",
      )}
    >
      <Icon className="mt-0.5 size-5 shrink-0 text-primary-strong" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className={cn("block break-words text-foreground", unread && "font-semibold")}>
          {notificationText(notification)}
        </span>
        <span className="mt-0.5 block text-sm text-muted-foreground">
          {relativeDay(notification.publishedAt, today)}
          {unread && <span className="sr-only"> (sin leer)</span>}
        </span>
      </span>
      {unread && <span className="mt-2 size-2.5 shrink-0 rounded-full bg-primary" aria-hidden />}
    </Link>
  );
}
