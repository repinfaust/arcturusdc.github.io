// Career Ops API — a thin binding of the shared career engine (D-SITE-034).
import { createCareerHandler } from '@/lib/careerEngine/handler';
import { careerOpsApp } from '@/lib/careerEngine/apps/careerOps';

export const POST = createCareerHandler(careerOpsApp);
