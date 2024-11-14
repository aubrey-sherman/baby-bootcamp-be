// FIXME: rename for consistency
type tFeedingEntryParams = {
  volumeInOunces: number;
  eliminating: boolean;
  feedingTime: Date;
  username: string;
}

// interface FeedingBlock {
//   id: string;
//   number: number;
//   isEliminating: boolean;
//   username: string;
// }
// interface UserType {
//   username: string;
//   name: string;
//   email: string;
//   createdAt: Date;
//   updatedAt: Date;
//   feedingBlocks?: FeedingBlock[];
// }
// interface UserWithBlocks extends tUser {
//   feedingBlocks: FeedingBlock[] | undefined;
// }

// type UserWithBlocks = {
//   username: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   babyName: string;
//   feedingBlocks: FeedingBlock[];
// };

// type FeedingBlock = {
//   id: string;
//   username: string;
//   number: number;
//   isEliminating: boolean;
// };

type UserType = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  babyName: string;
};

// type UserWithBlocks = UserType & {
//   feedingBlocks: FeedingBlock[];
// };

// Define the interface for what a User looks like
interface IUser {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  babyName: string;
}

// Define type for registration parameters
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

type UserWithBlocks = IUser & {
  feedingBlocks: FeedingBlock[];
};

export {
  FeedingBlock,
  tFeedingEntryParams ,
  UserType,
  RegisterParams,
  UserWithBlocks,
  IUser
};