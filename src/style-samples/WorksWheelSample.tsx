// Sample of the works wheel with numbered placeholder cards (a real edit uses real project photos or site screenshots).
import { staticFile } from "remotion";
import { WorksWheelVideo } from "../shared/WorksWheel";

const TITLES = ["Deck build", "Garage frame", "Basement", "Addition", "Barn", "Porch", "Pergola"];
const ITEMS = TITLES.map((title, i) => ({ title, image: staticFile(`images/works-wheel-sample/${i + 1}.jpg`) }));

export const WorksWheelSample: React.FC = () => <WorksWheelVideo items={ITEMS} holdRing={36} />;
