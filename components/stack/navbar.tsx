"use client";

import Link from "next/link";
import { Bookmark, Menu, ShoppingCart, UserRound } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { forwardRef, useEffect, useState } from "react";
import { useCart } from "@/components/cart/cart-provider";
import { usePathname, useRouter } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(pathname == "/" ? false : true);
  const router = useRouter();
  const { count, ready } = useCart();

  useEffect(() => {
    if (pathname !== "/") {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight - 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    if (typeof window !== "undefined") {
      if (pathname !== "/") {
        setIsScrolled(true); // Aktifkan navbar scrolled jika bukan di halaman root
      } else {
        window.addEventListener("scroll", handleScroll);
      }
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, [pathname]);

  return (
    <div
      className={`fixed top-0 z-40 w-full px-4 py-4 md:px-[50px] md:py-[20px] transition-colors flex justify-between ${
        pathname.includes("dashboard") && "hidden"
      }  ${
        isScrolled
          ? "text-black bg-white shadow-md"
          : "text-white bg-transparent"
      }`}
    >
      <img
        src={`${isScrolled ? "/logoo.png" : "/logo-uncut.png"}`}
        className="h-8 md:h-[50px] rounded-md"
        alt="Pulsar Logo"
      />

      {/* Mobile Navigation */}
      <Sheet>
        <SheetTrigger asChild className="md:hidden">
          <Button variant="ghost" size="icon">
            <Menu className="w-5 h-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="right">
          <div className="flex flex-col gap-4 mt-8">
            <Link
              href="/product"
              className="px-2 py-2 text-lg font-medium transition-colors hover:text-primary"
            >
              Explore
            </Link>
            <Link href="/cart" className="flex items-center gap-2 px-2 py-2 text-lg font-medium"><ShoppingCart size={19} /> Cart {ready && count > 0 ? `(${count})` : ""}</Link>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation */}
      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList className="gap-3">
          {/* bookmark */}
          <NavigationMenuItem>
            <Button variant={"ghost"} className="cursor-pointer">
              <Bookmark />
            </Button>
          </NavigationMenuItem>

          {/* co */}
          <NavigationMenuItem>
            <Link href="/cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg transition hover:bg-blue-50 hover:text-blue-600" aria-label="View cart">
              <ShoppingCart size={20} />
              {ready && count > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">{count}</span>}
            </Link>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <Button
              className={`cursor-pointer transition-colors ${
                "storefront-btn-primary"
              }`}
            >
              <UserRound />
              Sign in
            </Button>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </div>
  );
}

const ListItem = forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
