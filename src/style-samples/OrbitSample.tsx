// Sample of the Orbit graphic with generic marketing icons (lucide). Labels are placeholders: use the services or
// tools the video actually talks about.
import { AbsoluteFill } from "remotion";
import { Globe, Megaphone, MessageSquare, Phone, Search, Star, TrendingUp } from "lucide-react";
import { Orbit, type OrbitVideoItem } from "../shared/Orbit";

const icon = (I: typeof Search, color: string) => <I color={color} size="100%" strokeWidth={2} />;
const ITEMS: OrbitVideoItem[] = [
  { id: "google", icon: icon(Search, "#67E8F9"), label: "Google", ring: 0 },
  { id: "ads", icon: icon(Megaphone, "#67E8F9"), label: "Ads", ring: 0 },
  { id: "web", icon: icon(Globe, "#67E8F9"), label: "Website", ring: 0 },
  { id: "reviews", icon: icon(Star, "#D8B4FE"), label: "Reviews", ring: 1 },
  { id: "texts", icon: icon(MessageSquare, "#D8B4FE"), label: "Follow-up", ring: 1 },
  { id: "calls", icon: icon(Phone, "#D8B4FE"), label: "Calls", ring: 1 },
];

export const OrbitSample: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 47%, #111827, #030712 70%)" }}>
    <Orbit items={ITEMS} center={<TrendingUp color="#A5F3FC" size={84} strokeWidth={2.2} />} />
  </AbsoluteFill>
);
