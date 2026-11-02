import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Facebook, Instagram, Mail, Twitter, Youtube } from "lucide-react";
import Link from "next/link";

export function Footer({ compact = false }: { compact?: boolean }) {
  return (
    <footer className={"bg-neutral-950 text-white relative font-satoshi " + (compact ? "mt-0" : "mt-[200px]")}>
      <div className="container mx-auto px-4 py-12 flex gap-[50px] flex-col">
        <div className="flex flex-col md:flex-row justify-between gap-[50px]">
          {/* About Section */}
          <div className="md:w-[30%]">
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <img src="/logo.png" className="w-[50px]" alt="" />
              Pixel Perfection
            </h3>
            <p className="mb-4 text-gray-300">
              Discover a collection of exclusive, high-quality pixel art. From
              classic characters to fantasy worlds—find the perfect piece for
              you!
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="hover:text-blue-400 transition-colors">
                <Facebook className="w-5 h-5" />
              </Link>
              <Link href="#" className="hover:text-blue-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </Link>
              <Link href="#" className="hover:text-blue-400 transition-colors">
                <Instagram className="w-5 h-5" />
              </Link>
              <Link href="#" className="hover:text-blue-400 transition-colors">
                <Youtube className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Newsletter */}
          <div className="md:w-[30%]">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-[10px]">
              <Mail />
              Newsletter
            </h3>
            <p className="mb-4 text-gray-300">
              Subscribe to get updates on new pixel art releases and special
              offers.
            </p>
            <div className="flex flex-col space-y-2">
              <Input
                type="email"
                placeholder="Your email"
                className="bg-gray-800 border-gray-700 text-white"
              />
              <Button className="bg-blue-700 hover:bg-blue-600">
                Subscribe
              </Button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-center text-gray-400 text-sm">
          <p>
            © {new Date().getFullYear()} Pixel Perfection. All rights reserved.
          </p>
          <p className="mt-2">
            <span className="inline-block w-2 h-2 bg-blue-500 mr-1"></span>
            <span className="inline-block w-2 h-2 bg-blue-600 mr-1"></span>
            <span className="inline-block w-2 h-2 bg-blue-500 mr-1"></span>
            <span className="inline-block w-2 h-2 bg-blue-600"></span>
          </p>
        </div>
      </div>
    </footer>
  );
}
