"use client";

import AppHeader from "./AppHeader";

interface AppHeaderWrapperProps {
  userEmail?: string | null;
}

export default function AppHeaderWrapper({ userEmail }: AppHeaderWrapperProps) {
  return <AppHeader userEmail={userEmail} />;
}