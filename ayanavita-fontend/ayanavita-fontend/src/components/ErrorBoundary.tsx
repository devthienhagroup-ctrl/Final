// src/components/ErrorBoundary.tsx
import React from "react";
import { AppShell, Card, Hr, Muted, Title } from "../ui/ui";

type ErrorBoundaryState = {
  err: unknown;
};

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { err: null };

  static getDerivedStateFromError(err: unknown): ErrorBoundaryState {
    return { err };
  }

  componentDidCatch(err: unknown) {
    // Log để debug
    // eslint-disable-next-line no-console
    console.error("UI crashed:", err);
  }

  private formatError(err: unknown) {
    if (!err) return "Unknown error";
    if (err instanceof Error) return err.stack || err.message || String(err);
    if (typeof err === "string") return err;
    try {
      return JSON.stringify(err, null, 2);
    } catch {
      return String(err);
    }
  }

  render() {
    if (this.state.err) {
      const msg = this.formatError(this.state.err);

      return (
        <AppShell title={<Title>Ứng dụng bị lỗi runtime</Title>}>
          <Card>
            <Muted>Chi tiết lỗi:</Muted>
            <Hr />
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                margin: 0,
                fontSize: 12,
                color: "rgba(255,255,255,.85)",
              }}
            >
              {msg}
            </pre>
          </Card>
        </AppShell>
      );
    }

    return this.props.children;
  }
}
