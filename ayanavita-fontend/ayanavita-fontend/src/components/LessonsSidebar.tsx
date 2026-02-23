// src/components/LessonsSidebar.tsx
import React, { useMemo } from "react";
import { Link } from "react-router-dom";

import {
  Badge,
  Button,
  Card,
  Hr,
  Muted,
  Title,
  Tooltip,
  theme,
} from "../ui/ui";

import {
  IconCheck,
  IconClock,
  IconInfo,
  IconLock,
  IconPlay,
  IconUnlock,
} from "../ui/icons";

import {
  buildSequentialRows,
  type CourseProgressLike,
  type LessonLike,
  type LessonRow,
  type LessonStatusUI,
} from "../shared/lessons";

function StatusBadge({ status }: { status: LessonStatusUI }) {
  if (status === "COMPLETED") {
    return (
      <Badge tone="success">
        <IconCheck />
        COMPLETED
      </Badge>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <Badge tone="warning">
        <IconClock />
        IN_PROGRESS
      </Badge>
    );
  }
  return <Badge tone="neutral">NOT_STARTED</Badge>;
}

export function LessonsSidebar({
  title = "Lessons",
  lessons,
  progress,
  rows,
  currentLessonId,
  courseId,
  sticky = false,

  primaryLabel = "Mở",
  onPrimary,

  secondaryLabel,
  secondaryHref,

  emptyText = "Chưa có lesson hoặc bạn chưa có quyền xem danh sách.",
}: {
  title?: string;

  lessons: LessonLike[] | null | undefined;
  progress?: CourseProgressLike | null;

  /**
   * Nếu bạn đã build rows ở page (để reuse tiếp cho continue/nav),
   * truyền vào để tránh compute lại.
   */
  rows?: LessonRow[];

  currentLessonId?: number;
  courseId?: number;

  sticky?: boolean;

  primaryLabel?: string;
  onPrimary?: (lessonId: number) => void;

  secondaryLabel?: string;
  secondaryHref?: (lessonId: number) => string;

  emptyText?: string;
}) {
  const seqRows = useMemo(() => {
    return rows ?? buildSequentialRows(lessons ?? [], progress ?? null);
  }, [rows, lessons, progress]);

  return (
    <Card
      style={{
        position: sticky ? "sticky" : "relative",
        top: sticky ? 12 : undefined,
        height: sticky ? "calc(100vh - 24px)" : undefined,
        overflow: sticky ? "auto" : undefined,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <Title>{title}</Title>
        <Muted>
          <span style={{ fontSize: 12 }}>
            {courseId ? `courseId=${courseId}` : "sequential"}
          </span>
        </Muted>
      </div>

      <Hr />

      {!seqRows.length ? (
        <Muted>{emptyText}</Muted>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
          {seqRows.map((r, idx) => {
            const locked = !r.unlocked;
            const isActive = currentLessonId === r.lesson.id;
            const LeftIcon = locked ? IconLock : IconUnlock;

            return (
              <div
                key={r.lesson.id}
                style={{
                  border: `1px solid ${isActive ? "rgba(124,58,237,.65)" : theme.colors.border}`,
                  borderRadius: 14,
                  padding: 12,
                  background: isActive ? "rgba(124,58,237,.10)" : "rgba(2,6,23,.25)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  alignItems: "center",
                  opacity: locked ? 0.6 : 1,
                }}
              >
                <div style={{ display: "flex", gap: 12, alignItems: "center", minWidth: 0 }}>
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 12,
                      display: "grid",
                      placeItems: "center",
                      border: `1px solid ${theme.colors.border}`,
                      background: "rgba(2,6,23,.35)",
                      flex: "0 0 auto",
                    }}
                  >
                    <LeftIcon />
                  </div>

                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 950,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                      title={r.lesson.title}
                    >
                      {idx + 1}. {r.lesson.title}
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "center",
                      }}
                    >
                      <StatusBadge status={r.status} />

                      {locked ? (
                        <Badge tone="danger">LOCKED</Badge>
                      ) : (
                        <Badge tone="success">UNLOCKED</Badge>
                      )}

                      {locked && r.lockedReason ? (
                        <Tooltip content={r.lockedReason}>
                          <span>
                            <Badge tone="warning">
                              <IconInfo /> Why?
                            </Badge>
                          </span>
                        </Tooltip>
                      ) : null}
                    </div>

                    {locked && r.lockedReason ? (
                      <div style={{ marginTop: 8, color: theme.colors.muted, fontSize: 12 }}>
                        {r.lockedReason}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <Tooltip
                    disabled={!locked}
                    content={r.lockedReason ?? "Bị khoá do chưa hoàn thành bài trước"}
                  >
                    <span>
                      <Button
                        tone="primary"
                        variant={locked ? "ghost" : "solid"}
                        disabled={locked}
                        leftIcon={<IconPlay />}
                        onClick={() => onPrimary?.(r.lesson.id)}
                      >
                        {primaryLabel}
                      </Button>
                    </span>
                  </Tooltip>

                  {secondaryLabel && secondaryHref ? (
                    <Tooltip
                      disabled={!locked}
                      content={r.lockedReason ?? "Bị khoá do chưa hoàn thành bài trước"}
                    >
                      <span>
                        <Link
                          to={secondaryHref(r.lesson.id)}
                          style={{
                            pointerEvents: locked ? "none" : "auto",
                            opacity: locked ? 0.6 : 1,
                            textDecoration: "none",
                          }}
                        >
                          <Button tone="neutral" variant="ghost">
                            {secondaryLabel}
                          </Button>
                        </Link>
                      </span>
                    </Tooltip>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
