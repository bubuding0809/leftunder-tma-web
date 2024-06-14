import { useMiniApp, useViewport } from "@tma.js/sdk-react";
import { type PropsWithChildren, useEffect } from "react";

interface MainLayoutProps extends PropsWithChildren {
  title: string;
}

export default function MainLayout({ title, children }: MainLayoutProps) {
  const miniApp = useMiniApp(true);
  const tmaViewport = useViewport(true);

  useEffect(() => {
    miniApp?.ready();
    miniApp?.setHeaderColor("#1C5638");
    tmaViewport?.expand();
  }, [miniApp, tmaViewport]);

  return <main className="flex h-screen flex-col">{children}</main>;
}
