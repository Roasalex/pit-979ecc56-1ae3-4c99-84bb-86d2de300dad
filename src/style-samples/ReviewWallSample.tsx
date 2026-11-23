// Layout sample of ReviewWall. The text is a placeholder that says so: a real edit uses the client's real reviews.
import { ReviewWall, type VideoReview } from "../shared/ReviewWall";

const REVIEWS: VideoReview[] = Array.from({ length: 6 }, (_, i) => ({
  name: `Reviewer ${i + 1}`,
  body: "Placeholder: a real customer review goes here, word for word.",
  rating: 5,
  source: "Google",
}));

export const ReviewWallSample: React.FC = () => <ReviewWall reviews={REVIEWS} />;
