"use client"

import Link from "next/link"
import {
  ImageIcon,
  Video,
  Coins,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const features = [
  {
    title: "Image Generator",
    description: "Generate gambar produk profesional dengan AI untuk kebutuhan marketing Anda",
    icon: ImageIcon,
    href: "/dashboard/image-generator",
    color: "from-green-500 to-emerald-500",
  },
  {
    title: "Video Generator",
    description: "Buat video promosi sinematik untuk TikTok dan Reels dengan AI terbaru",
    icon: Video,
    href: "/dashboard/video-generator",
    color: "from-indigo-500 to-purple-500",
  }
]

export function DashboardOverview() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">AI Studio Features</h2>
        <p className="text-muted-foreground mt-2">
          Pilih fitur AI yang ingin Anda gunakan untuk mengembangkan bisnis affiliate Anda
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <Link key={feature.href} href={feature.href}>
              <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-primary/5 hover:border-primary/50 cursor-pointer h-full">
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity group-hover:opacity-5",
                    feature.color
                  )}
                />
                <CardHeader>
                  <div
                    className={cn(
                      "mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br text-white",
                      feature.color
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full group-hover:bg-primary/10">
                    Mulai Sekarang →
                  </Button>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Top Up Credit Section */}
      <div>
        <Link href="/dashboard/credits">
          <Card className="group relative overflow-hidden transition-all hover:shadow-lg hover:shadow-amber-500/10 hover:border-amber-500/50 cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-500 opacity-0 transition-opacity group-hover:opacity-5" />
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                    <Coins className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="group-hover:text-amber-500 transition-colors">
                      Top Up Credit
                    </CardTitle>
                    <CardDescription>
                      Tambah credit untuk menggunakan semua fitur AI generator
                    </CardDescription>
                  </div>
                </div>
                <Button variant="outline" className="group-hover:border-amber-500 group-hover:text-amber-500">
                  Beli Credit →
                </Button>
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  )
}
