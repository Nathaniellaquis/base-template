import { router } from '@/trpc/trpc';
import { list } from './list';
import { create } from './create';
import { switchRoute } from './switch';
import { generateInvite } from './generate-invite';
import { validateInvite } from './validate-invite';
import { joinWithInvite } from './join-with-invite';

export const workspaceRouter = router({
  list,
  create,
  switch: switchRoute,
  generateInvite,
  validateInvite,
  joinWithInvite,
});