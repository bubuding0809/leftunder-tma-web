import MainLayout from "#/components/layouts/MainLayout";
import { TmaSDKLoader } from "#/components/layouts/TmaSdkLoader";
import { Button, buttonVariants } from "#/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "#/components/ui/sheet";
import {
  AlignLeft,
  ChevronLeft,
  EggFried,
  HeartHandshake,
  Home,
  Leaf,
} from "lucide-react";
import { NextPageWithLayout } from "./_app";
import Link from "next/link";
import { cn } from "#/lib/utils";
import { usePathname } from "next/navigation";

const RecipePage: NextPageWithLayout = () => {
  const pathName = usePathname();

  return (
    <div className="relative">
      <div className="sticky top-0 z-10">
        {/* Top header */}
        <div
          className="rounded-b-3xl bg-cover bg-left-bottom bg-no-repeat px-4 pb-5 pt-8"
          style={{
            backgroundImage: `url(/assets/header_background.png)`,
          }}
        >
          <div className="flex items-center space-x-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ring-offset-2 hover:bg-transparent hover:ring-1"
                >
                  <AlignLeft className="h-6 w-6 text-white" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <nav className="pt-10">
                  <ul className="flex flex-col space-y-10">
                    <Link
                      href="/pantry"
                      className={cn("flex items-center space-x-2")}
                    >
                      <Home className="h-5 w-5" />
                      <p
                        className={cn(
                          pathName === "/pantry" && "font-semibold",
                        )}
                      >
                        My pantry
                      </p>
                    </Link>
                    <Link
                      href="/stats"
                      className={cn("flex items-center space-x-2")}
                    >
                      <Leaf className="h-5 w-5" />
                      <p
                        className={cn(pathName === "/stats" && "font-semibold")}
                      >
                        My Stats
                      </p>
                    </Link>
                    <Link
                      href="/recipe"
                      className={cn("flex items-center space-x-2")}
                    >
                      <EggFried className="h-5 w-5" />
                      <p
                        className={cn(
                          pathName === "/recipe" && "font-semibold",
                        )}
                      >
                        Recipe Generator
                      </p>
                    </Link>
                    <Link
                      href="/donate"
                      className={cn("flex items-center space-x-2")}
                    >
                      <HeartHandshake className="h-5 w-5" />
                      <p
                        className={cn(
                          pathName === "/donate" && "font-semibold",
                        )}
                      >
                        Donate
                      </p>
                    </Link>
                    <li className="flex items-center space-x-2"></li>
                    <li className="flex items-center space-x-2"></li>
                  </ul>
                </nav>
              </SheetContent>
            </Sheet>
            <hgroup className="flex items-center justify-between text-white">
              <h1 className="text-2xl">Recipes</h1>
            </hgroup>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center p-10">
        <span className="text-5xl">🚧</span>
        <p className="mt-2 text-center text-lg font-semibold text-red-500">
          Work in progress
        </p>
        <span className="mt-2 text-center text-sm text-gray-500">
          Feature coming soon, stay tuned!
        </span>
        <Link href="/pantry" className={cn(buttonVariants(), "mt-4")}>
          <ChevronLeft className="h-5 w-5" />
          <span className="ml-1">Back to pantry</span>
        </Link>
      </div>
    </div>
  );
};

RecipePage.getLayout = (page) => {
  return (
    <TmaSDKLoader>
      <MainLayout title="Recipe">{page}</MainLayout>
    </TmaSDKLoader>
  );
};

export default RecipePage;
