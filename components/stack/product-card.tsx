import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import Image from "next/image";

interface ProductCardProps {
  title: string;
  description: string;
  tags: string[];
  price: number;
  imageUrl: string;
}

export function ProductCard({
  title,
  description,
  tags,
  price,
  imageUrl,
}: ProductCardProps) {
  return (
    <Card className="overflow-hidden transition-all hover:shadow-md pt-0 font-satoshi shadow-lg">
      {/* image */}
      <div className="aspect-square relative overflow-hidden">
        <img
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          className="w-full h-full object-cover transition-transform hover:scale-105 z-0"
        />
        <div className="px-2 py-0.5 bottom-3 right-3 absolute z-20 rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-10 border border-gray-100">
          <p className="font-bold text-[.8rem]">
            {new Intl.NumberFormat("id-ID", {
              style: "currency",
              currency: "IDR",
              maximumFractionDigits: 0,
            }).format(price)}
          </p>
        </div>
      </div>
      <CardHeader className="">
        <div className="flex justify-between items-start">
          <h3 className="font-extrabold text-md ">{title}</h3>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      <CardContent className=" pt-0">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
