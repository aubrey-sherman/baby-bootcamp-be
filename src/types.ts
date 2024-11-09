// FIXME: rename for consistency
type tUser = {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  babyName: string;
}

// FIXME: rename for consistency
type tFeedingEntryParams = {
  volumeInOunces: number;
  eliminating: boolean;
  feedingTime: Date;
  username: string;
}

interface FeedingBlock {
  id: string;
  number: number;
  isEliminating: boolean;
  username: string;
}
interface UserType {
  username: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  feedingBlocks?: FeedingBlock[];
}
interface UserWithBlocks extends User {
  feedingBlocks: FeedingBlock[];
}

export {
  tUser,
  tFeedingEntryParams ,
  UserType,
  UserWithBlocks
};