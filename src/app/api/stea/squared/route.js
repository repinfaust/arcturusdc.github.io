// Squared API — a binding of the shared career engine with Squared's own
// collections, prompts and actions (D-SITE-034).
import { createCareerHandler } from '@/lib/careerEngine/handler';
import { squaredApp } from '@/lib/careerEngine/apps/squared';

export const POST = createCareerHandler(squaredApp);
