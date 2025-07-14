import { router } from '../../trpc/trpc';
import { createUser } from './create-user';
import { getUser } from './get-user';
import { updateUser } from './update-user';

export const userRouter = router({
    get: getUser,
    create: createUser,
    update: updateUser,
});