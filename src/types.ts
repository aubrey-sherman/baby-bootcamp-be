type tFeedingEntryParams = {
  volumeInOunces: number;
  eliminating: boolean;
  feedingTime: Date;
  username: string;
}

type UserType = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  babyName: string;
  isAdmin?: boolean;
};

interface IUser {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  babyName: string;
}

interface RegisterParams {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  babyName: string;
}

type FeedingBlock = {
  id: string;
  username: string;
  number: number;
  isEliminating: boolean;
};

// type UserWithBlocks = IUser & {
//   feedingBlocks: FeedingBlock[];
// };

export {
  FeedingBlock,
  tFeedingEntryParams ,
  UserType,
  RegisterParams,
  IUser,
};