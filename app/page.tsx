"use client";

import { Footer } from "@/components/stack/footer";
import { ProductCard } from "@/components/stack/product-card";
import { Button } from "@/components/ui/button";
import { Globe, Map } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { products } from "./dummy";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Home() {
  const router = useRouter();
  return (
    <div>
      {/* hero */}
      <div className="relative h-screen w-full font-satoshi">
        {/* Hero Background */}
        <Image
          src="/wallpaper.gif"
          alt="banner"
          layout="fill"
          objectFit="cover"
          className="absolute top-0 left-0 w-full h-full"
        />

        {/* Overlay Gelap */}
        <div className="absolute top-0 left-0 w-full h-full bg-black/40  "></div>

        {/* Konten Hero (Opsional) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white text-center">
          <h1 className="text-4xl font-extrabold font-satoshi">
            Pixel Perfection
          </h1>
          <p className="text-lg font-satoshi">
            Discover a collection of exclusive, high-quality pixel art. From
            classic characters to fantasy worlds—find the perfect piece for you!
          </p>
          <div className="flex gap-5 justify-center">
            <Button
              className="bg-blue-700 hover:bg-blue-600 cursor-pointer"
              onClick={() => router.push("/product")}
            >
              <Globe />
              Explore
            </Button>
          </div>
        </div>

        {/* card glass */}
        <div className="w-[200px] text-white absolute left-3 bottom-3 p-3 rounded-xl bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-30 border border-neutral-100/50">
          <h5 className="font-bold text-[1.5rem]">55+ design</h5>
          <p className="text-[.8rem]">
            Choose from Over 55 Unique Designs for Your Need
          </p>
        </div>
      </div>

      {/* explore */}
      <div className="pt-[200px] px-4 md:px-6 lg:px-8 bg-gray-50" id="explore">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Explore Our Collection</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Browse our handcrafted pixel art creations. Each piece is designed
              with attention to detail and available exclusively on our
              platform.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                title={product.title}
                description={product.description}
                tags={product.tags}
                price={product.price}
                imageUrl={product.imageUrl}
              />
            ))}
          </div>
        </div>
      </div>

      {/* find us */}
      <div className="pt-[200px] px-5 md:px-6 lg:px-8 bg-gray-50 flex justify-center gap-10 flex-col md:flex-row h-fit">
        {/* text */}
        <div className="w-full md:w-1/2 font-satoshi">
          <h2 className="text-[7rem] font-extrabold mb-4 leading-[100px]">
            Find Our Place
          </h2>
          <p className="w-full">
            Step into a space where colors speak, pixels breathe, and every
            detail tells a story. This is where imagination finds its shape —
            and you, your place.
          </p>
        </div>

        {/* image */}
        <div className="w-full md:w-1/2 h-[280px]">
          <div className="w-full bg-black h-full relative rounded-md">
            <Image
              src="/store.webp"
              alt="location"
              layout="fill"
              objectFit="cover"
              className="shadow-lg rounded-md"
            />
            <div className="flex flex-col justify-center gap-[10px] w-[200px] h-[200px] bg-white shadow-xl border-neutral-900/10 border-1 absolute -bottom-[100px] left-5 rounded-md text-center">
              <Image
                alt="pin map"
                src={"/pin.png"}
                width={50}
                height={100}
                className="mx-auto"
              />
              <div>
                <p className="font-bold font-satoshi">jl Cisaranten no 28</p>
                <p className="font-satoshi text-[.8rem] font-medium leading-[15px]">
                  Visit our store
                </p>
              </div>
              <Button className="mx-[10px]">
                <Map /> maps
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* faq */}
      <div className="pt-[200px]">
        {/* header */}
        <div className="text-center">
          <h2 className="text-2xl font-bold">FAQ ?</h2>
          <p>some frequently asked questions</p>
        </div>

        {/* body */}
        <div className="w-[90%] md:w-1/2 mx-auto !font-satoshi">
          <Accordion type="single" collapsible>
            <AccordionItem value="item-1">
              <AccordionTrigger className="font-bold font-satoshi text-lg">
                What products do you sell?
              </AccordionTrigger>
              <AccordionContent>
                We offer a variety of pixel art-themed accessories including
                keychains, tote bags, stickers, and custom prints.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger className="font-bold font-satoshi text-lg">
                Can I request a custom pixel art design?
              </AccordionTrigger>
              <AccordionContent>
                Yes! We accept custom orders for pixel art designs. Just send us
                your concept or reference, and we’ll create it for you.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger className="font-bold font-satoshi text-lg">
                What printing methods do you use?
              </AccordionTrigger>
              <AccordionContent>
                We use high-quality digital printing for vibrant pixel details,
                and we also offer heat press for textile items like shirts and
                tote bags.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger className="font-bold font-satoshi text-lg">
                Do you ship internationally?
              </AccordionTrigger>
              <AccordionContent>
                Yes, we ship worldwide. Shipping fees and delivery times vary
                based on your location.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger className="font-bold font-satoshi text-lg">
                How can I place an order?
              </AccordionTrigger>
              <AccordionContent>
                You can place an order through our website or contact us
                directly on Instagram or WhatsApp for custom requests.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* footer */}
      <Footer />
    </div>
  );
}
