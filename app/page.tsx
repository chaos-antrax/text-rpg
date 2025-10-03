import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center gap-12">
          {/* Hero Section */}
          <div className="text-center space-y-4 max-w-3xl">
            <h1 className="text-5xl font-bold tracking-tight text-balance">Welcome to the World of Eryndor</h1>
            <p className="text-xl text-muted-foreground text-balance">
              Embark on an epic text-based adventure powered by AI. Explore vast continents, battle fearsome creatures,
              and shape a living world with your actions.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 w-full max-w-5xl">
            <Card>
              <CardHeader>
                <CardTitle>Dynamic Storytelling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Every adventure is unique. AI-driven narratives adapt to your choices, creating personalized stories
                  that unfold differently for each player.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Living World</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Your actions matter. Collapse ruins, discover NPCs, and change the world. Other players will encounter
                  the consequences of your journey.
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custom Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Create your own unique skills with custom names and elements. Build a character that truly reflects
                  your playstyle.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button asChild size="lg">
              <Link href="/auth/sign-up">Begin Your Adventure</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/auth/login">Continue Your Journey</Link>
            </Button>
          </div>

          {/* World Info */}
          <div className="mt-12 max-w-4xl">
            <h2 className="text-2xl font-semibold mb-6 text-center">Explore Five Continents</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Eryndor</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Fertile central lands, home to trade cities and guilds
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Skaldor Peaks</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Harsh snowy mountains with ancient tribes and monasteries
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Valtheris Marshes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Swampy regions full of poisonous plants and hidden ruins
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Ashen Wastes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Desert wasteland scattered with ruins of fallen kingdoms
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="text-lg">Nytheris Isles</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Mysterious islands shrouded in mist and danger</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
