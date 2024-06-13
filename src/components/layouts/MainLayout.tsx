import { useClosingBehavior, useMiniApp } from "@tma.js/sdk-react";
import { type PropsWithChildren, useEffect } from "react";
import { usePathname } from "next/navigation";
import PageHeader from "#/components/layouts/Pageheader";

interface MainLayoutProps extends PropsWithChildren {
  title: string;
}

export default function MainLayout({ title, children }: MainLayoutProps) {
  const miniApp = useMiniApp(true);
  const tmaClosingBehavior = useClosingBehavior(true);

  const pathName = usePathname();

  useEffect(() => {
    miniApp?.ready();
    miniApp?.setHeaderColor("#1C5638");
  }, [miniApp, pathName]);

  return <main className="flex h-screen flex-col">{children}</main>;
}
